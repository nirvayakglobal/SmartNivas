"""
Society Administration Service for Smart Nivas
Business Logic Layer (Single Responsibility Principle) handling:
1. ACID transaction for bulk-generating wings and flats (e.g. Floor 1 to 10, Flats 1 to 4).
   Rolls back completely if a duplicate flat conflict occurs.
2. ACID transaction for bulk CSV resident import (wing_name, flat_number, full_name, phone_number, resident_type).
3. Gate creation enforcing max_gates_allowed quota from society entitlements,
   plus Security Guard 4-digit PIN account creation.
4. Digital notice publishing.

Follows SOLID principles (DIP constructor injection), ACID principles, and SKILL.md standards.
"""

import csv
import io
from typing import Any, Dict, List, Optional, Tuple
from werkzeug.security import generate_password_hash

from backend_api.repositories.society_topology_and_user_repository import (
    SocietyTopologyAndUserRepository,
)
from backend_api.database.mysql_connection_pool_manager import (
    MySQLConnectionPoolManager,
    global_database_connection_manager,
)


class SocietyAdministrationService:
    """
    Service orchestrating administrative workflows for Society Managing Committees.
    """

    def __init__(
        self,
        topology_repository: SocietyTopologyAndUserRepository,
        database_connection_manager: MySQLConnectionPoolManager = global_database_connection_manager,
    ) -> None:
        self._topology_repository: SocietyTopologyAndUserRepository = (
            topology_repository
        )
        self._database_connection_manager: MySQLConnectionPoolManager = (
            database_connection_manager
        )

    # -------------------------------------------------------------------------
    # WINGS & FLATS BULK GENERATOR (ACID TRANSACTION)
    # -------------------------------------------------------------------------

    def retrieve_society_topology(
        self, society_id: int
    ) -> Dict[str, Any]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            wings_list: List[Dict[str, Any]] = (
                self._topology_repository.get_all_wings_for_society(
                    database_cursor=database_cursor,
                    society_id=society_id,
                )
            )
            flats_list: List[Dict[str, Any]] = (
                self._topology_repository.get_all_flats_for_society(
                    database_cursor=database_cursor,
                    society_id=society_id,
                )
            )
            return {"wings": wings_list, "flats": flats_list}

    def bulk_generate_wings_and_flats(
        self,
        society_id: int,
        wing_names_list: List[str],
        start_floor_number: int,
        end_floor_number: int,
        flats_per_floor_count: int,
        numbering_pattern: str = "FLOOR_PREFIX",  # "FLOOR_PREFIX" (e.g. 101, 102) or "SEQUENTIAL"
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        ATOMIC ACID WORKFLOW:
        Generates wings and flats. If any flat number already exists in a given wing,
        the transaction raises an IntegrityError and rolls back the entire batch.
        """
        if not wing_names_list:
            return False, "At least one wing name must be specified.", None

        if start_floor_number > end_floor_number or flats_per_floor_count <= 0:
            return False, "Invalid floor range or flats per floor count.", None

        total_flats_created_count = 0
        total_wings_created_count = 0

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            for raw_wing_name in wing_names_list:
                cleaned_wing_name: str = raw_wing_name.strip().upper()
                if not cleaned_wing_name:
                    continue

                existing_wing: Optional[Dict[str, Any]] = (
                    self._topology_repository.find_wing_by_name(
                        database_cursor=database_cursor,
                        society_id=society_id,
                        wing_name=cleaned_wing_name,
                    )
                )

                if existing_wing:
                    active_wing_id: int = existing_wing["wing_id"]
                else:
                    active_wing_id = self._topology_repository.insert_wing(
                        database_cursor=database_cursor,
                        society_id=society_id,
                        wing_name=cleaned_wing_name,
                    )
                    total_wings_created_count += 1

                for floor_index in range(start_floor_number, end_floor_number + 1):
                    for unit_index in range(1, flats_per_floor_count + 1):
                        # Construct flat number (e.g. 101, 102 or A-101)
                        if numbering_pattern == "FLOOR_PREFIX":
                            flat_number_string: str = (
                                f"{floor_index}{unit_index:02d}"
                            )
                        else:
                            flat_number_string = f"{floor_index}-{unit_index}"

                        # Check collision (Unique constraint on (wing_id, flat_number))
                        conflicting_flat: Optional[Dict[str, Any]] = (
                            self._topology_repository.find_flat_by_wing_and_number(
                                database_cursor=database_cursor,
                                wing_id=active_wing_id,
                                flat_number=flat_number_string,
                            )
                        )

                        if conflicting_flat:
                            raise ValueError(
                                f"Flat '{flat_number_string}' already exists in Wing '{cleaned_wing_name}'. "
                                f"Entire batch has been rolled back to maintain schema consistency."
                            )

                        self._topology_repository.insert_flat(
                            database_cursor=database_cursor,
                            society_id=society_id,
                            wing_id=active_wing_id,
                            flat_number=flat_number_string,
                            floor_number=floor_index,
                            occupancy_status="OWNER_OCCUPIED",
                        )
                        total_flats_created_count += 1

        summary_payload: Dict[str, Any] = {
            "wings_created_count": total_wings_created_count,
            "flats_created_count": total_flats_created_count,
        }
        return (
            True,
            f"Bulk generation completed: {total_flats_created_count} flats created across {len(wing_names_list)} wings.",
            summary_payload,
        )

    # -------------------------------------------------------------------------
    # RESIDENTS DIRECTORY & CSV BULK IMPORT (ACID TRANSACTION)
    # -------------------------------------------------------------------------

    def retrieve_society_residents(
        self, society_id: int
    ) -> List[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            return self._topology_repository.get_all_residents_for_society(
                database_cursor=database_cursor,
                society_id=society_id,
            )

    def import_residents_from_csv(
        self,
        society_id: int,
        csv_file_content_string: str,
        default_temporary_password: str = "Resident@SmartNivas2026!",
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        ATOMIC ACID WORKFLOW:
        Parses CSV with header: wing_name, flat_number, full_name, phone_number, resident_type
        Resolves flat_id for each row. Inserts resident user records.
        If any phone number collides within the society or flat does not exist,
        rolls back entire transaction.
        """
        csv_text_stream = io.StringIO(csv_file_content_string.strip())
        csv_dictionary_reader = csv.DictReader(csv_text_stream)

        # Normalize header keys
        imported_resident_records_count = 0
        default_resident_password_hash: str = generate_password_hash(
            default_temporary_password, method="scrypt"
        )

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            for row_line_number, resident_row in enumerate(
                csv_dictionary_reader, start=2
            ):
                wing_name: Optional[str] = resident_row.get("wing_name")
                flat_number: Optional[str] = resident_row.get("flat_number")
                full_name: Optional[str] = resident_row.get("full_name")
                phone_number: Optional[str] = resident_row.get("phone_number")
                resident_type: str = resident_row.get("resident_type", "OWNER")

                if not wing_name or not flat_number or not full_name or not phone_number:
                    raise ValueError(
                        f"CSV Row {row_line_number}: Missing required fields. All rows must contain wing_name, flat_number, full_name, and phone_number."
                    )

                cleaned_wing_name: str = wing_name.strip().upper()
                cleaned_flat_number: str = flat_number.strip()
                cleaned_full_name: str = full_name.strip()
                cleaned_phone_number: str = phone_number.strip()
                normalized_resident_type: str = (
                    resident_type.strip().upper()
                    if resident_type.strip().upper() in {"OWNER", "TENANT", "FAMILY_MEMBER"}
                    else "OWNER"
                )

                # Locate wing
                wing_record: Optional[Dict[str, Any]] = (
                    self._topology_repository.find_wing_by_name(
                        database_cursor=database_cursor,
                        society_id=society_id,
                        wing_name=cleaned_wing_name,
                    )
                )
                if not wing_record:
                    raise ValueError(
                        f"CSV Row {row_line_number}: Wing '{cleaned_wing_name}' does not exist in this society."
                    )

                # Locate flat
                flat_record: Optional[Dict[str, Any]] = (
                    self._topology_repository.find_flat_by_wing_and_number(
                        database_cursor=database_cursor,
                        wing_id=wing_record["wing_id"],
                        flat_number=cleaned_flat_number,
                    )
                )
                if not flat_record:
                    raise ValueError(
                        f"CSV Row {row_line_number}: Flat '{cleaned_flat_number}' does not exist in Wing '{cleaned_wing_name}'."
                    )

                # Insert resident user
                self._topology_repository.insert_resident_user(
                    database_cursor=database_cursor,
                    society_id=society_id,
                    flat_id=flat_record["flat_id"],
                    full_name=cleaned_full_name,
                    phone_number=cleaned_phone_number,
                    password_hash=default_resident_password_hash,
                    resident_type=normalized_resident_type,
                    approval_status="APPROVED",
                )
                imported_resident_records_count += 1

        summary_payload = {
            "imported_resident_records_count": imported_resident_records_count,
        }
        return (
            True,
            f"Successfully imported {imported_resident_records_count} residents atomically.",
            summary_payload,
        )

    # -------------------------------------------------------------------------
    # GATES & SECURITY GUARDS SETUP
    # -------------------------------------------------------------------------

    def retrieve_society_gates_and_guards(
        self, society_id: int
    ) -> Dict[str, Any]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            gates_list: List[Dict[str, Any]] = (
                self._topology_repository.get_all_gates_for_society(
                    database_cursor=database_cursor,
                    society_id=society_id,
                )
            )
            guards_list: List[Dict[str, Any]] = (
                self._topology_repository.get_all_guards_for_society(
                    database_cursor=database_cursor,
                    society_id=society_id,
                )
            )
            return {"gates": gates_list, "guards": guards_list}

    def setup_new_society_gate(
        self,
        society_id: int,
        gate_name: str,
    ) -> Tuple[bool, str, Optional[int]]:
        """
        Enforces max_gates_allowed entitlement check before creating a new gate.
        """
        cleaned_gate_name: str = gate_name.strip()
        if not cleaned_gate_name:
            return False, "Gate name cannot be blank.", None

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            society_record: Optional[Dict[str, Any]] = (
                self._topology_repository.find_society_by_id(
                    database_cursor=database_cursor,
                    society_id=society_id,
                )
            )
            if not society_record:
                return False, "Society not found.", None

            max_gates_allowed: int = int(society_record["max_gates_allowed"])
            current_gate_count: int = (
                self._topology_repository.count_gates_for_society(
                    database_cursor=database_cursor,
                    society_id=society_id,
                )
            )

            if current_gate_count >= max_gates_allowed:
                return (
                    False,
                    f"Gate creation limit reached. Your society subscription plan allows a maximum of {max_gates_allowed} gates. Please upgrade plan to add more gates.",
                    None,
                )

            new_gate_id: int = self._topology_repository.insert_gate(
                database_cursor=database_cursor,
                society_id=society_id,
                gate_name=cleaned_gate_name,
            )
            return True, "Gate setup successfully.", new_gate_id

    def setup_new_security_guard(
        self,
        society_id: int,
        full_name: str,
        phone_number: str,
        four_digit_pin: str,
    ) -> Tuple[bool, str, Optional[int]]:
        """
        Creates Security Guard account with 4-digit PIN hashed using scrypt.
        """
        cleaned_pin: str = four_digit_pin.strip()
        if len(cleaned_pin) != 4 or not cleaned_pin.isdigit():
            return False, "Security guard passcode must be an exact 4-digit numeric PIN.", None

        guard_pin_password_hash: str = generate_password_hash(
            cleaned_pin, method="scrypt"
        )

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            new_guard_user_id: int = self._topology_repository.insert_guard_user(
                database_cursor=database_cursor,
                society_id=society_id,
                full_name=full_name.strip(),
                phone_number=phone_number.strip(),
                password_hash=guard_pin_password_hash,
            )
            return True, "Security Guard account created successfully.", new_guard_user_id

    # -------------------------------------------------------------------------
    # VISITOR LOGS REGISTER & DIGITAL NOTICE BOARD
    # -------------------------------------------------------------------------

    def retrieve_society_visitor_logs(
        self, society_id: int, limit_record_count: int = 100
    ) -> List[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            return self._topology_repository.get_visitor_logs_for_society(
                database_cursor=database_cursor,
                society_id=society_id,
                limit_record_count=limit_record_count,
            )

    def retrieve_society_notices(
        self, society_id: int
    ) -> List[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            return self._topology_repository.get_all_notices_for_society(
                database_cursor=database_cursor,
                society_id=society_id,
            )

    def publish_society_notice(
        self,
        society_id: int,
        admin_user_id: int,
        notice_title: str,
        notice_body_content: str,
    ) -> Tuple[bool, str, Optional[int]]:
        if not notice_title.strip() or not notice_body_content.strip():
            return False, "Notice title and content cannot be blank.", None

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            new_notice_id: int = self._topology_repository.insert_notice(
                database_cursor=database_cursor,
                society_id=society_id,
                notice_title=notice_title.strip(),
                notice_body_content=notice_body_content.strip(),
                published_by_admin_user_id=admin_user_id,
            )
            return True, "Digital notice published successfully.", new_notice_id
