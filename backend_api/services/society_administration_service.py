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
            members_list: List[Dict[str, Any]] = (
                self._topology_repository.get_active_flat_members_for_society(
                    database_cursor=database_cursor,
                    society_id=society_id,
                )
            )
            all_documents = self._topology_repository.get_all_documents_for_society_residents(
                database_cursor=database_cursor,
                society_id=society_id,
            )

            # Map documents by user_id
            documents_by_user_id: Dict[int, List[Dict[str, Any]]] = {}
            for doc_item in all_documents:
                target_user_id = doc_item["user_id"]
                if target_user_id not in documents_by_user_id:
                    documents_by_user_id[target_user_id] = []
                documents_by_user_id[target_user_id].append(doc_item)

            for member in members_list:
                user_id_key = member.get("user_id")
                member["documents"] = documents_by_user_id.get(user_id_key, [])

            # Group members by flat_id
            members_by_flat_id: Dict[int, List[Dict[str, Any]]] = {}
            for member in members_list:
                flat_id_key = member.get("flat_id")
                if flat_id_key is not None:
                    members_by_flat_id.setdefault(flat_id_key, []).append(member)

            # Attach members directly to flat object
            for flat_item in flats_list:
                flat_item["members"] = members_by_flat_id.get(flat_item["flat_id"], [])

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

    def create_single_flat(
        self,
        society_id: int,
        wing_name: str,
        floor_number: int,
        flat_number: str,
        occupancy_status: str = "OWNER_OCCUPIED",
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Creates an individual flat in a wing. If the wing does not exist, it creates it.
        Validates flat_number uniqueness within the wing.
        """
        cleaned_wing_name: str = wing_name.strip().upper()
        cleaned_flat_number: str = flat_number.strip().upper()

        if not cleaned_wing_name or not cleaned_flat_number:
            raise ValueError("Wing name and flat number cannot be empty.")

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
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

            conflicting_flat: Optional[Dict[str, Any]] = (
                self._topology_repository.find_flat_by_wing_and_number(
                    database_cursor=database_cursor,
                    wing_id=active_wing_id,
                    flat_number=cleaned_flat_number,
                )
            )

            if conflicting_flat:
                raise ValueError(
                    f"Flat '{cleaned_flat_number}' already exists in Wing '{cleaned_wing_name}'."
                )

            created_flat_id: int = self._topology_repository.insert_flat(
                database_cursor=database_cursor,
                society_id=society_id,
                wing_id=active_wing_id,
                flat_number=cleaned_flat_number,
                floor_number=floor_number,
                occupancy_status=occupancy_status,
            )

        return (
            True,
            f"Flat '{cleaned_flat_number}' created successfully in Wing '{cleaned_wing_name}'.",
            {"flat_id": created_flat_id},
        )

    def update_flat(
        self,
        society_id: int,
        flat_id: int,
        flat_number: str,
        floor_number: int,
        occupancy_status: str,
    ) -> Tuple[bool, str]:
        """
        Updates flat number, floor number, or occupancy status.
        Ensures flat exists and does not collide with another flat in the same wing.
        """
        cleaned_flat_number: str = flat_number.strip().upper()
        if not cleaned_flat_number:
            raise ValueError("Flat number cannot be empty.")

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            existing_flat: Optional[Dict[str, Any]] = (
                self._topology_repository.find_flat_by_id(
                    database_cursor=database_cursor,
                    society_id=society_id,
                    flat_id=flat_id,
                )
            )
            if not existing_flat:
                raise ValueError("Target flat not found.")

            wing_id: int = existing_flat["wing_id"]
            conflicting_flat: Optional[Dict[str, Any]] = (
                self._topology_repository.find_flat_by_wing_and_number(
                    database_cursor=database_cursor,
                    wing_id=wing_id,
                    flat_number=cleaned_flat_number,
                )
            )
            if conflicting_flat and conflicting_flat["flat_id"] != flat_id:
                raise ValueError(
                    f"Flat '{cleaned_flat_number}' already exists in this wing."
                )

            self._topology_repository.update_flat_details(
                database_cursor=database_cursor,
                society_id=society_id,
                flat_id=flat_id,
                flat_number=cleaned_flat_number,
                floor_number=floor_number,
                occupancy_status=occupancy_status,
            )

        return True, f"Flat '{cleaned_flat_number}' updated successfully."

    def delete_flat(
        self,
        society_id: int,
        flat_id: int,
    ) -> Tuple[bool, str]:
        """
        Safely deletes a flat from the society.
        """
        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            existing_flat: Optional[Dict[str, Any]] = (
                self._topology_repository.find_flat_by_id(
                    database_cursor=database_cursor,
                    society_id=society_id,
                    flat_id=flat_id,
                )
            )
            if not existing_flat:
                raise ValueError("Flat not found.")

            self._topology_repository.delete_flat_by_id(
                database_cursor=database_cursor,
                society_id=society_id,
                flat_id=flat_id,
            )

        return True, "Flat deleted successfully."

    # -------------------------------------------------------------------------
    # RESIDENTS DIRECTORY & CSV BULK IMPORT (ACID TRANSACTION)
    # -------------------------------------------------------------------------

    def retrieve_society_residents(
        self, society_id: int
    ) -> List[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            residents_list = self._topology_repository.get_all_residents_for_society(
                database_cursor=database_cursor,
                society_id=society_id,
            )
            all_documents = self._topology_repository.get_all_documents_for_society_residents(
                database_cursor=database_cursor,
                society_id=society_id,
            )

            # Map documents by user_id
            documents_by_user_id: Dict[int, List[Dict[str, Any]]] = {}
            for doc_item in all_documents:
                target_user_id = doc_item["user_id"]
                if target_user_id not in documents_by_user_id:
                    documents_by_user_id[target_user_id] = []
                documents_by_user_id[target_user_id].append(doc_item)

            for resident_record in residents_list:
                user_id = resident_record["user_id"]
                resident_record["documents"] = documents_by_user_id.get(user_id, [])

            return residents_list

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
                    if resident_type.strip().upper()
                    in {"OWNER", "TENANT", "OWNER_FAMILY", "TENANT_FAMILY", "FAMILY_MEMBER"}
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
                self._topology_repository.refresh_flat_occupancy_status(
                    database_cursor=database_cursor,
                    flat_id=flat_record["flat_id"],
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

    def update_resident(
        self,
        society_id: int,
        user_id: int,
        full_name: str,
        phone_number: str,
        wing_name: str,
        flat_number: str,
        resident_type: str,
        approval_status: str,
    ) -> Tuple[bool, str]:
        """
        Updates resident details and links them to their wing/flat.
        """
        cleaned_full_name: str = full_name.strip()
        cleaned_phone_number: str = phone_number.strip()
        cleaned_wing_name: str = wing_name.strip().upper()
        cleaned_flat_number: str = flat_number.strip().upper()

        if not cleaned_full_name or not cleaned_phone_number:
            raise ValueError("Full name and phone number cannot be empty.")

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            existing_user: Optional[Dict[str, Any]] = (
                self._topology_repository.find_user_by_id(
                    database_cursor=database_cursor,
                    user_id=user_id,
                )
            )
            if not existing_user or existing_user["society_id"] != society_id:
                raise ValueError("Target resident not found in this society.")

            # Validate target flat exists
            target_flat: Optional[Dict[str, Any]] = (
                self._topology_repository.find_flat_by_wing_name_and_flat_number(
                    database_cursor=database_cursor,
                    society_id=society_id,
                    wing_name=cleaned_wing_name,
                    flat_number=cleaned_flat_number,
                )
            )
            if not target_flat:
                raise ValueError(
                    f"Flat '{cleaned_flat_number}' does not exist in Wing '{cleaned_wing_name}'."
                )

            old_flat_id: Optional[int] = existing_user.get("flat_id")
            self._topology_repository.update_resident_user(
                database_cursor=database_cursor,
                society_id=society_id,
                user_id=user_id,
                full_name=cleaned_full_name,
                phone_number=cleaned_phone_number,
                flat_id=target_flat["flat_id"],
                resident_type=resident_type,
                approval_status=approval_status,
            )
            # Refresh occupancy status for both old and new flats
            if old_flat_id:
                self._topology_repository.refresh_flat_occupancy_status(
                    database_cursor=database_cursor,
                    flat_id=old_flat_id,
                )
            self._topology_repository.refresh_flat_occupancy_status(
                database_cursor=database_cursor,
                flat_id=target_flat["flat_id"],
            )

        return True, f"Resident '{cleaned_full_name}' updated successfully."

    def update_resident_approval_status(
        self,
        society_id: int,
        user_id: int,
        approval_status: str,
    ) -> Tuple[bool, str]:
        """
        Updates a resident's approval status (PENDING, APPROVED, REJECTED).
        When status changes to/from APPROVED, re-evaluates flat occupancy.
        """
        normalized_status = approval_status.strip().upper()
        if normalized_status not in {"PENDING", "APPROVED", "REJECTED"}:
            raise ValueError("Status must be PENDING, APPROVED, or REJECTED.")

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            existing_user: Optional[Dict[str, Any]] = (
                self._topology_repository.find_user_by_id(
                    database_cursor=database_cursor,
                    user_id=user_id,
                )
            )
            if not existing_user or existing_user["society_id"] != society_id:
                raise ValueError("Target resident not found in this society.")

            self._topology_repository.update_resident_approval_status(
                database_cursor=database_cursor,
                society_id=society_id,
                user_id=user_id,
                approval_status=normalized_status,
            )

            target_flat_id: Optional[int] = existing_user.get("flat_id")
            if target_flat_id:
                self._topology_repository.refresh_flat_occupancy_status(
                    database_cursor=database_cursor,
                    flat_id=target_flat_id,
                )

        return True, f"Resident status updated to {normalized_status}."

    def delete_resident(
        self,
        society_id: int,
        user_id: int,
    ) -> Tuple[bool, str]:
        """
        Deletes a resident user from the society directory.
        """
        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            existing_user: Optional[Dict[str, Any]] = (
                self._topology_repository.find_user_by_id(
                    database_cursor=database_cursor,
                    user_id=user_id,
                )
            )
            if not existing_user or existing_user["society_id"] != society_id:
                raise ValueError("Target resident not found in this society.")

            target_flat_id: Optional[int] = existing_user.get("flat_id")
            self._topology_repository.delete_resident_user(
                database_cursor=database_cursor,
                society_id=society_id,
                user_id=user_id,
            )
            if target_flat_id:
                self._topology_repository.refresh_flat_occupancy_status(
                    database_cursor=database_cursor,
                    flat_id=target_flat_id,
                )

        return True, "Resident deleted successfully."

    # -------------------------------------------------------------------------
    # RESIDENT VERIFICATION DOCUMENTS WORKFLOW
    # -------------------------------------------------------------------------

    def retrieve_resident_documents(
        self,
        society_id: int,
        user_id: int,
    ) -> List[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            existing_user = self._topology_repository.find_user_by_id(
                database_cursor=database_cursor,
                user_id=user_id,
            )
            if not existing_user or existing_user["society_id"] != society_id:
                raise ValueError("Target resident not found in this society.")

            return self._topology_repository.get_documents_for_resident(
                database_cursor=database_cursor,
                society_id=society_id,
                user_id=user_id,
            )

    def attach_document_to_resident(
        self,
        society_id: int,
        user_id: int,
        document_type: str,
        document_title: str,
        file_name: str,
        file_path_or_url: str,
        file_size_bytes: Optional[int] = None,
        uploaded_by_user_id: Optional[int] = None,
    ) -> Tuple[bool, str, Optional[int]]:
        allowed_types = {
            "AADHAAR_CARD",
            "FLAT_INDEX_COPY",
            "OWNER_PHOTO",
            "RENT_AGREEMENT",
            "POLICE_VERIFICATION",
            "OTHER",
        }
        normalized_doc_type = document_type.strip().upper()
        if normalized_doc_type not in allowed_types:
            raise ValueError(f"Invalid document type '{document_type}'.")

        cleaned_title = document_title.strip() or normalized_doc_type.replace("_", " ").title()
        cleaned_file_name = file_name.strip() or "document.pdf"

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            existing_user = self._topology_repository.find_user_by_id(
                database_cursor=database_cursor,
                user_id=user_id,
            )
            if not existing_user or existing_user["society_id"] != society_id:
                raise ValueError("Target resident not found in this society.")

            new_doc_id = self._topology_repository.insert_resident_document(
                database_cursor=database_cursor,
                society_id=society_id,
                user_id=user_id,
                document_type=normalized_doc_type,
                document_title=cleaned_title,
                file_name=cleaned_file_name,
                file_path_or_url=file_path_or_url,
                file_size_bytes=file_size_bytes,
                uploaded_by_user_id=uploaded_by_user_id,
            )

        return True, "Document uploaded successfully.", new_doc_id

    def remove_resident_document(
        self,
        society_id: int,
        document_id: int,
    ) -> Tuple[bool, str]:
        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            self._topology_repository.delete_resident_document(
                database_cursor=database_cursor,
                society_id=society_id,
                document_id=document_id,
            )
        return True, "Document deleted successfully."

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

    def toggle_guard_active_status(
        self,
        society_id: int,
        guard_user_id: int,
        is_active: bool,
    ) -> Tuple[bool, str]:
        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            self._topology_repository.update_guard_status(
                database_cursor=database_cursor,
                society_id=society_id,
                guard_user_id=guard_user_id,
                is_active=is_active,
            )
            action = "activated" if is_active else "inactivated"
            return True, f"Security Guard has been {action} successfully."

    def update_security_guard(
        self,
        society_id: int,
        guard_user_id: int,
        full_name: str,
        phone_number: str,
        four_digit_pin: Optional[str] = None,
    ) -> Tuple[bool, str]:
        cleaned_pin = four_digit_pin.strip() if four_digit_pin else None
        password_hash = None
        if cleaned_pin:
            if len(cleaned_pin) != 4 or not cleaned_pin.isdigit():
                return False, "Security guard passcode must be an exact 4-digit numeric PIN."
            password_hash = generate_password_hash(cleaned_pin, method="scrypt")

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            self._topology_repository.update_guard_details(
                database_cursor=database_cursor,
                society_id=society_id,
                guard_user_id=guard_user_id,
                full_name=full_name.strip(),
                phone_number=phone_number.strip(),
                password_hash=password_hash,
            )
            return True, "Security Guard updated successfully."

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

    def retrieve_society_dashboard_metrics(
        self, society_id: int
    ) -> Dict[str, Any]:
        """
        Retrieves live operational metrics for the Society Command Center.
        """
        with self._database_connection_manager.database_read_scope() as database_cursor:
            return self._topology_repository.get_society_dashboard_summary_metrics(
                database_cursor=database_cursor,
                society_id=society_id,
            )

    def checkout_visitor(
        self, society_id: int, visit_log_id: int
    ) -> Tuple[bool, str]:
        """
        Records the checkout exit timestamp for an on-campus visitor.
        """
        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            self._topology_repository.update_visitor_exit_timestamp(
                database_cursor=database_cursor,
                society_id=society_id,
                visit_log_id=visit_log_id,
            )
        return True, "Visitor exit recorded successfully."

    def create_single_resident(
        self,
        society_id: int,
        wing_name: str,
        flat_number: str,
        full_name: str,
        phone_number: str,
        resident_type: str = "OWNER",
        approval_status: str = "APPROVED",
        documents: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[bool, str, Optional[int]]:
        """
        Creates an individual resident record linked to an existing flat.
        Supports admin registration with optional verification documents and initial approval status.
        """
        cleaned_wing_name: str = wing_name.strip().upper()
        cleaned_flat_number: str = flat_number.strip().upper()
        cleaned_full_name: str = full_name.strip()
        cleaned_phone_number: str = phone_number.strip()
        normalized_approval_status: str = approval_status.strip().upper()
        if normalized_approval_status not in {"PENDING", "APPROVED", "REJECTED"}:
            normalized_approval_status = "APPROVED"

        if not cleaned_full_name or not cleaned_phone_number:
            return False, "Full name and phone number are required.", None

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            target_flat: Optional[Dict[str, Any]] = (
                self._topology_repository.find_flat_by_wing_name_and_flat_number(
                    database_cursor=database_cursor,
                    society_id=society_id,
                    wing_name=cleaned_wing_name,
                    flat_number=cleaned_flat_number,
                )
            )
            if not target_flat:
                return (
                    False,
                    f"Flat '{cleaned_flat_number}' in Wing '{cleaned_wing_name}' does not exist.",
                    None,
                )

            # Check if phone number is already registered in this society
            existing_residents: List[Dict[str, Any]] = (
                self._topology_repository.find_user_by_phone_number_and_optional_society(
                    database_cursor=database_cursor,
                    phone_number=cleaned_phone_number,
                    society_id=society_id,
                )
            )
            if existing_residents:
                return (
                    False,
                    f"A user with phone number '{cleaned_phone_number}' already exists in this society.",
                    None,
                )

            default_password_hash: str = generate_password_hash(
                "Resident@SmartNivas2026!", method="scrypt"
            )
            new_resident_id: int = self._topology_repository.insert_resident_user(
                database_cursor=database_cursor,
                society_id=society_id,
                flat_id=target_flat["flat_id"],
                full_name=cleaned_full_name,
                phone_number=cleaned_phone_number,
                password_hash=default_password_hash,
                resident_type=resident_type.upper(),
                approval_status=normalized_approval_status,
            )

            # Attach optional verification documents provided at registration time
            if documents and isinstance(documents, list):
                for doc_item in documents:
                    doc_type = str(doc_item.get("document_type", "OTHER")).upper()
                    doc_title = str(doc_item.get("document_title", "")).strip() or doc_type.replace("_", " ").title()
                    file_name = str(doc_item.get("file_name", "document.pdf")).strip()
                    file_path_or_url = str(doc_item.get("file_path_or_url", "")).strip()
                    file_size = doc_item.get("file_size_bytes")
                    if file_path_or_url:
                        self._topology_repository.insert_resident_document(
                            database_cursor=database_cursor,
                            society_id=society_id,
                            user_id=new_resident_id,
                            document_type=doc_type,
                            document_title=doc_title,
                            file_name=file_name,
                            file_path_or_url=file_path_or_url,
                            file_size_bytes=int(file_size) if file_size else None,
                        )

            self._topology_repository.refresh_flat_occupancy_status(
                database_cursor=database_cursor,
                flat_id=target_flat["flat_id"],
            )
            return True, f"Resident '{cleaned_full_name}' added successfully.", new_resident_id

    def transfer_flat_ownership(
        self,
        society_id: int,
        flat_id: int,
        admin_user_id: int,
        new_owner_name: str,
        new_owner_phone: str,
        transfer_sale_date: str,
        sale_deed_document_url: Optional[str] = None,
        sale_deed_document_filename: Optional[str] = None,
        transfer_remarks: Optional[str] = None,
        transfer_fee_inr: float = 0.0,
        fee_category: str = "SOCIETY_TRANSFER_FEE",
        society_development_fund_inr: float = 0.0,
        payment_mode: str = "NEFT_RTGS",
        payment_reference_number: Optional[str] = None,
        deactivate_previous_owner: bool = True,
    ) -> Tuple[bool, str, Optional[int]]:
        """
        Executes an ownership sale/transfer workflow:
        1. Records historical ownership transfer audit entry.
        2. Deactivates previous owner & family accounts (resident_type -> PAST_OWNER, is_active -> FALSE).
        3. Creates and activates the new owner record.
        4. Attaches the Sale Deed / Index-II document to the new owner's profile.
        5. Updates flat occupancy status atomically.
        """
        cleaned_owner_name: str = new_owner_name.strip()
        cleaned_owner_phone: str = new_owner_phone.strip()
        if not cleaned_owner_name or not cleaned_owner_phone:
            return False, "New owner name and phone number are required.", None

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            # 1. Look up flat
            database_cursor.execute(
                "SELECT flat_id, society_id, wing_id, flat_number, occupancy_status FROM flats WHERE flat_id = %s AND society_id = %s",
                (flat_id, society_id),
            )
            target_flat: Optional[Dict[str, Any]] = database_cursor.fetchone()
            if not target_flat:
                return False, "Target apartment flat not found.", None

            # 2. Find current active owner (if any)
            database_cursor.execute(
                "SELECT user_id, full_name, phone_number, resident_type "
                "FROM users WHERE flat_id = %s AND society_id = %s AND resident_type = 'OWNER' AND is_active = TRUE "
                "LIMIT 1",
                (flat_id, society_id),
            )
            current_owner: Optional[Dict[str, Any]] = database_cursor.fetchone()

            previous_owner_id: Optional[int] = current_owner["user_id"] if current_owner else None
            previous_owner_name_val: str = current_owner["full_name"] if current_owner else "Builder / Initial Developer"
            previous_owner_phone_val: Optional[str] = current_owner["phone_number"] if current_owner else None

            # 3. Check if new owner phone number already exists
            database_cursor.execute(
                "SELECT user_id, full_name, flat_id FROM users WHERE phone_number = %s AND society_id = %s",
                (cleaned_owner_phone, society_id),
            )
            conflicting_user: Optional[Dict[str, Any]] = database_cursor.fetchone()

            default_password_hash: str = generate_password_hash(
                "Resident@SmartNivas2026!", method="scrypt"
            )

            new_owner_id: int
            if conflicting_user:
                # Update existing user to new owner of this flat
                new_owner_id = conflicting_user["user_id"]
                database_cursor.execute(
                    "UPDATE users SET "
                    "full_name = %s, flat_id = %s, user_role = 'RESIDENT', resident_type = 'OWNER', "
                    "approval_status = 'APPROVED', is_active = TRUE "
                    "WHERE user_id = %s",
                    (cleaned_owner_name, flat_id, new_owner_id),
                )
            else:
                # Insert fresh owner user
                new_owner_id = self._topology_repository.insert_resident_user(
                    database_cursor=database_cursor,
                    society_id=society_id,
                    flat_id=flat_id,
                    full_name=cleaned_owner_name,
                    phone_number=cleaned_owner_phone,
                    password_hash=default_password_hash,
                    resident_type="OWNER",
                    approval_status="APPROVED",
                )

            # 4. Attach Sale Deed / Registered Index-II Document
            if sale_deed_document_url:
                self._topology_repository.insert_resident_document(
                    database_cursor=database_cursor,
                    society_id=society_id,
                    user_id=new_owner_id,
                    document_type="SALE_DEED",
                    document_title="Registered Sale Deed / Transfer Agreement",
                    file_name=sale_deed_document_filename or "sale_deed_transfer.pdf",
                    file_path_or_url=sale_deed_document_url,
                    file_size_bytes=None,
                )

            # 5. Insert Flat Ownership Transfer History Entry
            self._topology_repository.insert_flat_ownership_history(
                database_cursor=database_cursor,
                society_id=society_id,
                flat_id=flat_id,
                previous_owner_user_id=previous_owner_id,
                previous_owner_name=previous_owner_name_val,
                previous_owner_phone=previous_owner_phone_val,
                new_owner_user_id=new_owner_id,
                new_owner_name=cleaned_owner_name,
                new_owner_phone=cleaned_owner_phone,
                transfer_sale_date=transfer_sale_date,
                sale_deed_document_url=sale_deed_document_url,
                sale_deed_document_filename=sale_deed_document_filename,
                transfer_remarks=transfer_remarks,
                transfer_fee_inr=float(transfer_fee_inr or 0.0),
                fee_category=fee_category,
                society_development_fund_inr=float(society_development_fund_inr or 0.0),
                payment_mode=payment_mode,
                payment_reference_number=payment_reference_number,
                recorded_by_admin_user_id=admin_user_id,
            )

            # 6. Deactivate all prior owners and their family members if requested
            if deactivate_previous_owner:
                self._topology_repository.deactivate_owner_and_family_members(
                    database_cursor=database_cursor,
                    society_id=society_id,
                    flat_id=flat_id,
                    new_owner_user_id=new_owner_id,
                )

            # 7. Update flat status
            self._topology_repository.refresh_flat_occupancy_status(
                database_cursor=database_cursor,
                flat_id=flat_id,
            )

            return True, f"Ownership of Flat {target_flat['flat_number']} successfully transferred to {cleaned_owner_name}.", new_owner_id

    def retrieve_flat_ownership_history(
        self, society_id: int, flat_id: int
    ) -> List[Dict[str, Any]]:
        """
        Retrieves complete ownership audit trail for a flat.
        """
        with self._database_connection_manager.database_read_scope() as database_cursor:
            return self._topology_repository.get_ownership_history_for_flat(
                database_cursor=database_cursor,
                society_id=society_id,
                flat_id=flat_id,
            )
