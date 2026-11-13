"""
Society Topology and User Repository for Smart Nivas
Data Access Layer (Single Responsibility Principle) executing parameterized SQL queries.
Contains ZERO business logic, ZERO single-letter variables, and uses %s parameter substitution.
Methods for wings, flats, residents, gates, guards, visitor logs, and notices are scoped
strictly by authenticated society_id.
"""

from typing import Any, Dict, List, Optional
from pymysql.cursors import DictCursor


class SocietyTopologyAndUserRepository:
    """
    Repository responsible for data access related to users, societies, wings,
    flats, gates, guards, visitor logs, and notices.
    """

    # -------------------------------------------------------------------------
    # USERS & SOCIETY AUTHENTICATION
    # -------------------------------------------------------------------------

    def find_user_by_phone_number_and_optional_society(
        self,
        database_cursor: DictCursor,
        phone_number: str,
        society_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Finds user accounts matching phone number (handles 10-digit or leading zero variations).
        If society_id is provided, filters by that society or global accounts (society_id IS NULL).
        """
        cleaned_phone_number: str = phone_number.strip()
        alternate_phone_number: str = (
            cleaned_phone_number.lstrip("0")
            if cleaned_phone_number.startswith("0")
            else "0" + cleaned_phone_number
        )

        if society_id is not None:
            select_users_query: str = (
                "SELECT user_id, society_id, flat_id, full_name, phone_number, "
                "password_hash, user_role, resident_type, approval_status, "
                "bootstrap_activation_token, is_bootstrap_pending, is_active "
                "FROM users "
                "WHERE (phone_number = %s OR phone_number = %s) AND (society_id = %s OR society_id IS NULL)"
            )
            database_cursor.execute(
                select_users_query,
                (cleaned_phone_number, alternate_phone_number, society_id),
            )
        else:
            select_users_query: str = (
                "SELECT user_id, society_id, flat_id, full_name, phone_number, "
                "password_hash, user_role, resident_type, approval_status, "
                "bootstrap_activation_token, is_bootstrap_pending, is_active "
                "FROM users "
                "WHERE (phone_number = %s OR phone_number = %s)"
            )
            database_cursor.execute(
                select_users_query, (cleaned_phone_number, alternate_phone_number)
            )

        user_records: List[Dict[str, Any]] = database_cursor.fetchall()
        return user_records

    def find_user_by_id(
        self,
        database_cursor: DictCursor,
        user_id: int,
    ) -> Optional[Dict[str, Any]]:
        """
        Finds a specific user by primary key user_id.
        """
        select_user_query: str = (
            "SELECT user_id, society_id, flat_id, full_name, phone_number, "
            "password_hash, user_role, resident_type, approval_status, "
            "bootstrap_activation_token, is_bootstrap_pending, is_active, created_at "
            "FROM users WHERE user_id = %s"
        )
        database_cursor.execute(select_user_query, (user_id,))
        user_record: Optional[Dict[str, Any]] = database_cursor.fetchone()
        return user_record

    def find_user_by_bootstrap_token(
        self,
        database_cursor: DictCursor,
        bootstrap_activation_token: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves user associated with a pending bootstrap activation token.
        Uses row lock (FOR UPDATE) if run inside a transaction to prevent race conditions.
        """
        select_bootstrap_user_query: str = (
            "SELECT user_id, society_id, flat_id, full_name, phone_number, "
            "user_role, is_bootstrap_pending, is_active "
            "FROM users "
            "WHERE bootstrap_activation_token = %s AND is_bootstrap_pending = TRUE "
            "FOR UPDATE"
        )
        database_cursor.execute(
            select_bootstrap_user_query, (bootstrap_activation_token,)
        )
        user_record: Optional[Dict[str, Any]] = database_cursor.fetchone()
        return user_record

    def activate_society_admin_user(
        self,
        database_cursor: DictCursor,
        user_id: int,
        password_hash: str,
        full_name: Optional[str] = None,
    ) -> int:
        """
        Activates a bootstrap-pending user account by setting the password hash
        and clearing the bootstrap token atomically.
        """
        if full_name:
            update_user_query: str = (
                "UPDATE users "
                "SET password_hash = %s, full_name = %s, is_bootstrap_pending = FALSE, "
                "bootstrap_activation_token = NULL, is_active = TRUE "
                "WHERE user_id = %s AND is_bootstrap_pending = TRUE"
            )
            database_cursor.execute(
                update_user_query, (password_hash, full_name, user_id)
            )
        else:
            update_user_query: str = (
                "UPDATE users "
                "SET password_hash = %s, is_bootstrap_pending = FALSE, "
                "bootstrap_activation_token = NULL, is_active = TRUE "
                "WHERE user_id = %s AND is_bootstrap_pending = TRUE"
            )
            database_cursor.execute(update_user_query, (password_hash, user_id))

        affected_row_count: int = database_cursor.rowcount
        return affected_row_count

    def find_society_by_id(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> Optional[Dict[str, Any]]:
        """
        Finds a society record by primary key.
        """
        select_society_query: str = (
            "SELECT society_id, society_legal_name, society_unique_code, "
            "city_name, state_name, subscribed_plan_id, max_gates_allowed, "
            "photo_retention_days, enable_walkin_approval, enable_preapproval_passcode, "
            "enable_visitor_photo, enable_leave_at_gate, enable_notice_board, "
            "license_status, subscription_start_date, subscription_expiry_date "
            "FROM societies WHERE society_id = %s"
        )
        database_cursor.execute(select_society_query, (society_id,))
        society_record: Optional[Dict[str, Any]] = database_cursor.fetchone()
        return society_record

    def find_society_by_unique_code(
        self,
        database_cursor: DictCursor,
        society_unique_code: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Finds a society record by its unique uppercase code.
        """
        select_society_query: str = (
            "SELECT society_id, society_legal_name, society_unique_code, "
            "license_status, subscribed_plan_id "
            "FROM societies WHERE society_unique_code = %s"
        )
        database_cursor.execute(select_society_query, (society_unique_code,))
        society_record: Optional[Dict[str, Any]] = database_cursor.fetchone()
        return society_record

    # -------------------------------------------------------------------------
    # WINGS & FLATS TOPOLOGY
    # -------------------------------------------------------------------------

    def get_all_wings_for_society(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> List[Dict[str, Any]]:
        select_wings_query: str = (
            "SELECT wing_id, society_id, wing_name "
            "FROM wings WHERE society_id = %s "
            "ORDER BY wing_name ASC"
        )
        database_cursor.execute(select_wings_query, (society_id,))
        return database_cursor.fetchall()

    def find_wing_by_name(
        self,
        database_cursor: DictCursor,
        society_id: int,
        wing_name: str,
    ) -> Optional[Dict[str, Any]]:
        select_wing_query: str = (
            "SELECT wing_id, society_id, wing_name "
            "FROM wings WHERE society_id = %s AND wing_name = %s"
        )
        database_cursor.execute(select_wing_query, (society_id, wing_name))
        return database_cursor.fetchone()

    def insert_wing(
        self,
        database_cursor: DictCursor,
        society_id: int,
        wing_name: str,
    ) -> int:
        insert_wing_query: str = (
            "INSERT INTO wings (society_id, wing_name) VALUES (%s, %s)"
        )
        database_cursor.execute(insert_wing_query, (society_id, wing_name))
        return database_cursor.lastrowid

    def get_all_flats_for_society(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> List[Dict[str, Any]]:
        select_flats_query: str = (
            "SELECT f.flat_id, f.society_id, f.wing_id, f.flat_number, "
            "f.floor_number, f.occupancy_status, w.wing_name "
            "FROM flats f "
            "JOIN wings w ON f.wing_id = w.wing_id "
            "WHERE f.society_id = %s "
            "ORDER BY w.wing_name ASC, f.floor_number ASC, f.flat_number ASC"
        )
        database_cursor.execute(select_flats_query, (society_id,))
        return database_cursor.fetchall()

    def find_flat_by_wing_and_number(
        self,
        database_cursor: DictCursor,
        wing_id: int,
        flat_number: str,
    ) -> Optional[Dict[str, Any]]:
        select_flat_query: str = (
            "SELECT flat_id, society_id, wing_id, flat_number, floor_number, occupancy_status "
            "FROM flats WHERE wing_id = %s AND flat_number = %s"
        )
        database_cursor.execute(select_flat_query, (wing_id, flat_number))
        return database_cursor.fetchone()

    def find_flat_by_wing_name_and_flat_number(
        self,
        database_cursor: DictCursor,
        society_id: int,
        wing_name: str,
        flat_number: str,
    ) -> Optional[Dict[str, Any]]:
        select_flat_query: str = (
            "SELECT f.flat_id, f.society_id, f.wing_id, f.flat_number, f.floor_number, f.occupancy_status, w.wing_name "
            "FROM flats f "
            "JOIN wings w ON f.wing_id = w.wing_id "
            "WHERE f.society_id = %s AND w.wing_name = %s AND f.flat_number = %s"
        )
        database_cursor.execute(select_flat_query, (society_id, wing_name, flat_number))
        return database_cursor.fetchone()

    def insert_flat(
        self,
        database_cursor: DictCursor,
        society_id: int,
        wing_id: int,
        flat_number: str,
        floor_number: Optional[int],
        occupancy_status: str = "OWNER_OCCUPIED",
    ) -> int:
        insert_flat_query: str = (
            "INSERT INTO flats (society_id, wing_id, flat_number, floor_number, occupancy_status) "
            "VALUES (%s, %s, %s, %s, %s)"
        )
        database_cursor.execute(
            insert_flat_query,
            (society_id, wing_id, flat_number, floor_number, occupancy_status),
        )
        return database_cursor.lastrowid

    def find_flat_by_id(
        self,
        database_cursor: DictCursor,
        society_id: int,
        flat_id: int,
    ) -> Optional[Dict[str, Any]]:
        select_flat_query: str = (
            "SELECT flat_id, society_id, wing_id, flat_number, floor_number, occupancy_status "
            "FROM flats WHERE flat_id = %s AND society_id = %s"
        )
        database_cursor.execute(select_flat_query, (flat_id, society_id))
        return database_cursor.fetchone()

    def update_flat_details(
        self,
        database_cursor: DictCursor,
        society_id: int,
        flat_id: int,
        flat_number: str,
        floor_number: Optional[int],
        occupancy_status: str,
    ) -> None:
        update_flat_query: str = (
            "UPDATE flats SET flat_number = %s, floor_number = %s, occupancy_status = %s "
            "WHERE flat_id = %s AND society_id = %s"
        )
        database_cursor.execute(
            update_flat_query,
            (flat_number, floor_number, occupancy_status, flat_id, society_id),
        )

    def delete_flat_by_id(
        self,
        database_cursor: DictCursor,
        society_id: int,
        flat_id: int,
    ) -> None:
        delete_flat_query: str = (
            "DELETE FROM flats WHERE flat_id = %s AND society_id = %s"
        )
        database_cursor.execute(delete_flat_query, (flat_id, society_id))

    def refresh_flat_occupancy_status(
        self,
        database_cursor: DictCursor,
        flat_id: int,
    ) -> None:
        """
        Recalculates occupancy_status for a flat based on linked approved residents:
        - If any active resident is TENANT -> TENANT_OCCUPIED
        - Else if any active resident is OWNER -> OWNER_OCCUPIED
        - Else (no active registered owner or tenant) -> VACANT
        """
        update_occupancy_query: str = (
            "UPDATE flats f "
            "LEFT JOIN ( "
            "    SELECT "
            "        flat_id, "
            "        SUM(CASE WHEN resident_type IN ('TENANT', 'TENANT_FAMILY') THEN 1 ELSE 0 END) AS tenant_count, "
            "        SUM(CASE WHEN resident_type IN ('OWNER', 'OWNER_FAMILY') THEN 1 ELSE 0 END) AS owner_count "
            "    FROM users "
            "    WHERE flat_id = %s AND user_role = 'RESIDENT' AND is_active = TRUE "
            "    GROUP BY flat_id "
            ") u ON f.flat_id = u.flat_id "
            "SET f.occupancy_status = CASE "
            "    WHEN u.tenant_count > 0 THEN 'TENANT_OCCUPIED' "
            "    WHEN u.owner_count > 0 THEN 'OWNER_OCCUPIED' "
            "    ELSE 'VACANT' "
            "END "
            "WHERE f.flat_id = %s"
        )
        database_cursor.execute(update_occupancy_query, (flat_id, flat_id))

    # -------------------------------------------------------------------------
    # RESIDENTS DIRECTORY
    # -------------------------------------------------------------------------

    def get_all_residents_for_society(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> List[Dict[str, Any]]:
        select_residents_query: str = (
            "SELECT u.user_id, u.society_id, u.flat_id, u.full_name, u.phone_number, "
            "u.user_role, u.resident_type, u.relationship_type, u.approval_status, u.is_active, u.created_at, "
            "f.flat_number, w.wing_name "
            "FROM users u "
            "LEFT JOIN flats f ON u.flat_id = f.flat_id "
            "LEFT JOIN wings w ON f.wing_id = w.wing_id "
            "WHERE u.society_id = %s AND u.user_role = 'RESIDENT' "
            "ORDER BY w.wing_name ASC, f.flat_number ASC, u.full_name ASC"
        )
        database_cursor.execute(select_residents_query, (society_id,))
        return database_cursor.fetchall()

    def get_active_flat_members_for_society(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> List[Dict[str, Any]]:
        select_members_query: str = (
            "SELECT u.user_id, u.society_id, u.flat_id, u.full_name, u.phone_number, "
            "u.user_role, u.resident_type, u.relationship_type, u.approval_status "
            "FROM users u "
            "WHERE u.society_id = %s AND u.user_role = 'RESIDENT' AND u.is_active = TRUE "
            "ORDER BY u.flat_id ASC, "
            "CASE u.resident_type "
            "    WHEN 'OWNER' THEN 1 "
            "    WHEN 'OWNER_FAMILY' THEN 2 "
            "    WHEN 'TENANT' THEN 3 "
            "    WHEN 'TENANT_FAMILY' THEN 4 "
            "    ELSE 5 "
            "END, u.user_id ASC"
        )
        database_cursor.execute(select_members_query, (society_id,))
        return database_cursor.fetchall()

    def insert_resident_user(
        self,
        database_cursor: DictCursor,
        society_id: int,
        flat_id: int,
        full_name: str,
        phone_number: str,
        password_hash: str,
        resident_type: str = "OWNER",
        approval_status: str = "APPROVED",
    ) -> int:
        insert_user_query: str = (
            "INSERT INTO users ("
            "society_id, flat_id, full_name, phone_number, password_hash, "
            "user_role, resident_type, approval_status, is_active"
            ") VALUES (%s, %s, %s, %s, %s, 'RESIDENT', %s, %s, TRUE)"
        )
        database_cursor.execute(
            insert_user_query,
            (
                society_id,
                flat_id,
                full_name,
                phone_number,
                password_hash,
                resident_type,
                approval_status,
            ),
        )
        return database_cursor.lastrowid

    def update_resident_user(
        self,
        database_cursor: DictCursor,
        society_id: int,
        user_id: int,
        full_name: str,
        phone_number: str,
        flat_id: int,
        resident_type: str,
        approval_status: str,
    ) -> None:
        update_user_query: str = (
            "UPDATE users SET full_name = %s, phone_number = %s, flat_id = %s, "
            "resident_type = %s, approval_status = %s "
            "WHERE user_id = %s AND society_id = %s AND user_role = 'RESIDENT'"
        )
        database_cursor.execute(
            update_user_query,
            (
                full_name,
                phone_number,
                flat_id,
                resident_type,
                approval_status,
                user_id,
                society_id,
            ),
        )

    def update_resident_approval_status(
        self,
        database_cursor: DictCursor,
        society_id: int,
        user_id: int,
        approval_status: str,
    ) -> None:
        update_status_query: str = (
            "UPDATE users SET approval_status = %s "
            "WHERE user_id = %s AND society_id = %s AND user_role = 'RESIDENT'"
        )
        database_cursor.execute(update_status_query, (approval_status, user_id, society_id))

    def delete_resident_user(
        self,
        database_cursor: DictCursor,
        society_id: int,
        user_id: int,
    ) -> None:
        delete_user_query: str = (
            "DELETE FROM users "
            "WHERE user_id = %s AND society_id = %s AND user_role = 'RESIDENT'"
        )
        database_cursor.execute(delete_user_query, (user_id, society_id))

    # -------------------------------------------------------------------------
    # RESIDENT VERIFICATION DOCUMENTS
    # -------------------------------------------------------------------------

    def get_documents_for_resident(
        self,
        database_cursor: DictCursor,
        society_id: int,
        user_id: int,
    ) -> List[Dict[str, Any]]:
        select_documents_query: str = (
            "SELECT document_id, society_id, user_id, document_type, document_title, "
            "file_name, file_path_or_url, file_size_bytes, uploaded_by_user_id, created_at "
            "FROM resident_verification_documents "
            "WHERE society_id = %s AND user_id = %s "
            "ORDER BY created_at ASC, document_id ASC"
        )
        database_cursor.execute(select_documents_query, (society_id, user_id))
        return database_cursor.fetchall()

    def get_all_documents_for_society_residents(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> List[Dict[str, Any]]:
        select_all_query: str = (
            "SELECT document_id, society_id, user_id, document_type, document_title, "
            "file_name, file_path_or_url, file_size_bytes, uploaded_by_user_id, created_at "
            "FROM resident_verification_documents "
            "WHERE society_id = %s "
            "ORDER BY user_id ASC, created_at ASC"
        )
        database_cursor.execute(select_all_query, (society_id,))
        return database_cursor.fetchall()

    def insert_resident_document(
        self,
        database_cursor: DictCursor,
        society_id: int,
        user_id: int,
        document_type: str,
        document_title: str,
        file_name: str,
        file_path_or_url: str,
        file_size_bytes: Optional[int] = None,
        uploaded_by_user_id: Optional[int] = None,
    ) -> int:
        insert_query: str = (
            "INSERT INTO resident_verification_documents ("
            "society_id, user_id, document_type, document_title, "
            "file_name, file_path_or_url, file_size_bytes, uploaded_by_user_id"
            ") VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        )
        database_cursor.execute(
            insert_query,
            (
                society_id,
                user_id,
                document_type,
                document_title,
                file_name,
                file_path_or_url,
                file_size_bytes,
                uploaded_by_user_id,
            ),
        )
        return database_cursor.lastrowid

    def delete_resident_document(
        self,
        database_cursor: DictCursor,
        society_id: int,
        document_id: int,
    ) -> None:
        delete_query: str = (
            "DELETE FROM resident_verification_documents "
            "WHERE document_id = %s AND society_id = %s"
        )
        database_cursor.execute(delete_query, (document_id, society_id))

    # -------------------------------------------------------------------------
    # GATES & SECURITY GUARDS SETUP
    # -------------------------------------------------------------------------

    def get_all_gates_for_society(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> List[Dict[str, Any]]:
        select_gates_query: str = (
            "SELECT gate_id, society_id, gate_name FROM gates "
            "WHERE society_id = %s ORDER BY gate_id ASC"
        )
        database_cursor.execute(select_gates_query, (society_id,))
        return database_cursor.fetchall()

    def count_gates_for_society(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> int:
        count_query: str = (
            "SELECT COUNT(*) AS total_gate_count FROM gates WHERE society_id = %s"
        )
        database_cursor.execute(count_query, (society_id,))
        count_record = database_cursor.fetchone()
        return count_record["total_gate_count"] if count_record else 0

    def insert_gate(
        self,
        database_cursor: DictCursor,
        society_id: int,
        gate_name: str,
    ) -> int:
        insert_gate_query: str = (
            "INSERT INTO gates (society_id, gate_name) VALUES (%s, %s)"
        )
        database_cursor.execute(insert_gate_query, (society_id, gate_name))
        return database_cursor.lastrowid

    def get_all_guards_for_society(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> List[Dict[str, Any]]:
        select_guards_query: str = (
            "SELECT user_id, society_id, full_name, phone_number, is_active, created_at "
            "FROM users WHERE society_id = %s AND user_role = 'GUARD' "
            "ORDER BY full_name ASC"
        )
        database_cursor.execute(select_guards_query, (society_id,))
        return database_cursor.fetchall()

    def insert_guard_user(
        self,
        database_cursor: DictCursor,
        society_id: int,
        full_name: str,
        phone_number: str,
        password_hash: str,
    ) -> int:
        insert_guard_query: str = (
            "INSERT INTO users ("
            "society_id, flat_id, full_name, phone_number, password_hash, "
            "user_role, resident_type, approval_status, is_active"
            ") VALUES (%s, NULL, %s, %s, %s, 'GUARD', NULL, 'APPROVED', TRUE)"
        )
        database_cursor.execute(
            insert_guard_query,
            (society_id, full_name, phone_number, password_hash),
        )
        return database_cursor.lastrowid

    def update_guard_status(
        self,
        database_cursor: DictCursor,
        society_id: int,
        guard_user_id: int,
        is_active: bool,
    ) -> None:
        update_query: str = (
            "UPDATE users SET is_active = %s "
            "WHERE user_id = %s AND society_id = %s AND user_role = 'GUARD'"
        )
        database_cursor.execute(
            update_query,
            (is_active, guard_user_id, society_id),
        )

    def update_guard_details(
        self,
        database_cursor: DictCursor,
        society_id: int,
        guard_user_id: int,
        full_name: str,
        phone_number: str,
        password_hash: Optional[str] = None,
    ) -> None:
        if password_hash:
            update_query = (
                "UPDATE users SET full_name = %s, phone_number = %s, password_hash = %s "
                "WHERE user_id = %s AND society_id = %s AND user_role = 'GUARD'"
            )
            database_cursor.execute(
                update_query,
                (full_name, phone_number, password_hash, guard_user_id, society_id),
            )
        else:
            update_query = (
                "UPDATE users SET full_name = %s, phone_number = %s "
                "WHERE user_id = %s AND society_id = %s AND user_role = 'GUARD'"
            )
            database_cursor.execute(
                update_query,
                (full_name, phone_number, guard_user_id, society_id),
            )

    # -------------------------------------------------------------------------
    # SOCIETY VISITOR LOGS REGISTER (AUDIT & SEARCH)
    # -------------------------------------------------------------------------

    def get_visitor_logs_for_society(
        self,
        database_cursor: DictCursor,
        society_id: int,
        limit_record_count: int = 100,
    ) -> List[Dict[str, Any]]:
        select_logs_query: str = (
            "SELECT vl.visit_log_id, vl.society_id, vl.flat_id, vl.entry_gate_id, "
            "vl.entry_guard_user_id, vl.visitor_full_name, vl.visitor_phone_number, "
            "vl.visitor_category, vl.company_brand_name, vl.vehicle_registration_number, "
            "vl.visitor_photo_url, vl.approval_status, vl.decided_by_resident_user_id, "
            "vl.parcel_pickup_otp, vl.entry_timestamp, vl.exit_timestamp, vl.created_at, "
            "f.flat_number, w.wing_name, g.gate_name "
            "FROM visit_logs vl "
            "JOIN flats f ON vl.flat_id = f.flat_id "
            "JOIN wings w ON f.wing_id = w.wing_id "
            "LEFT JOIN gates g ON vl.entry_gate_id = g.gate_id "
            "WHERE vl.society_id = %s "
            "ORDER BY vl.created_at DESC "
            "LIMIT %s"
        )
        database_cursor.execute(select_logs_query, (society_id, limit_record_count))
        return database_cursor.fetchall()

    def update_visitor_exit_timestamp(
        self,
        database_cursor: DictCursor,
        society_id: int,
        visit_log_id: int,
    ) -> None:
        update_exit_query: str = (
            "UPDATE visit_logs SET exit_timestamp = CURRENT_TIMESTAMP "
            "WHERE visit_log_id = %s AND society_id = %s AND exit_timestamp IS NULL"
        )
        database_cursor.execute(update_exit_query, (visit_log_id, society_id))

    def get_society_dashboard_summary_metrics(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> Dict[str, Any]:
        """
        Calculates high-level KPI counts for the society command center.
        """
        # Flats & Occupancy breakdown
        flats_query: str = (
            "SELECT "
            "COUNT(*) AS total_flats_count, "
            "SUM(CASE WHEN occupancy_status = 'OWNER_OCCUPIED' THEN 1 ELSE 0 END) AS owner_occupied_count, "
            "SUM(CASE WHEN occupancy_status = 'TENANT_OCCUPIED' THEN 1 ELSE 0 END) AS tenant_occupied_count, "
            "SUM(CASE WHEN occupancy_status = 'VACANT' THEN 1 ELSE 0 END) AS vacant_flats_count "
            "FROM flats WHERE society_id = %s"
        )
        database_cursor.execute(flats_query, (society_id,))
        flats_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Residents count
        residents_query: str = (
            "SELECT COUNT(*) AS total_residents_count FROM users "
            "WHERE society_id = %s AND user_role = 'RESIDENT' AND is_active = TRUE"
        )
        database_cursor.execute(residents_query, (society_id,))
        residents_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Guards count
        guards_query: str = (
            "SELECT COUNT(*) AS total_guards_count FROM users "
            "WHERE society_id = %s AND user_role = 'GUARD' AND is_active = TRUE"
        )
        database_cursor.execute(guards_query, (society_id,))
        guards_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Gates count
        gates_query: str = (
            "SELECT COUNT(*) AS total_gates_count FROM gates WHERE society_id = %s"
        )
        database_cursor.execute(gates_query, (society_id,))
        gates_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Live visitors currently inside campus
        active_visitors_query: str = (
            "SELECT COUNT(*) AS active_campus_visitors_count FROM visit_logs "
            "WHERE society_id = %s AND exit_timestamp IS NULL "
            "AND approval_status IN ('APPROVED', 'AUTO_PREAPPROVED', 'INSIDE_CAMPUS', 'APPROVED_ENTRY')"
        )
        database_cursor.execute(active_visitors_query, (society_id,))
        active_visitors_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Notices count
        notices_query: str = (
            "SELECT COUNT(*) AS total_notices_count FROM notices WHERE society_id = %s"
        )
        database_cursor.execute(notices_query, (society_id,))
        notices_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Pending resident approvals count
        pending_approvals_query: str = (
            "SELECT COUNT(*) AS pending_approvals_count FROM users "
            "WHERE society_id = %s AND user_role = 'RESIDENT' AND approval_status = 'PENDING'"
        )
        database_cursor.execute(pending_approvals_query, (society_id,))
        pending_approvals_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Open helpdesk complaints count
        open_tickets_query: str = (
            "SELECT COUNT(*) AS open_helpdesk_tickets_count FROM helpdesk_tickets "
            "WHERE society_id = %s AND status NOT IN ('RESOLVED', 'CLOSED')"
        )
        database_cursor.execute(open_tickets_query, (society_id,))
        open_tickets_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Daily staff active & on campus count
        staff_query: str = (
            "SELECT "
            "COUNT(DISTINCT staff_id) AS total_active_staff_count "
            "FROM society_daily_staff WHERE society_id = %s AND status = 'ACTIVE'"
        )
        database_cursor.execute(staff_query, (str(society_id),))
        staff_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        staff_on_campus_query: str = (
            "SELECT COUNT(DISTINCT staff_id) AS staff_on_campus_count FROM society_staff_attendance_logs "
            "WHERE society_id = %s AND exit_timestamp IS NULL"
        )
        database_cursor.execute(staff_on_campus_query, (str(society_id),))
        staff_on_campus_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Financial billing & maintenance metrics
        billing_query: str = (
            "SELECT "
            "COALESCE(SUM(total_invoice_amount_inr), 0) AS total_billed_amount_inr, "
            "COALESCE(SUM(paid_amount_inr), 0) AS total_collected_amount_inr, "
            "COALESCE(SUM(outstanding_balance_inr), 0) AS total_due_amount_inr, "
            "COUNT(CASE WHEN payment_status = 'OVERDUE' THEN 1 END) AS overdue_invoices_count, "
            "COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) AS paid_invoices_count, "
            "COUNT(*) AS total_invoices_count "
            "FROM flat_invoices WHERE society_id = %s"
        )
        database_cursor.execute(billing_query, (society_id,))
        billing_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Society Expense Vouchers & Accounts Payable metrics
        expense_summary_query: str = (
            "SELECT "
            "COUNT(*) AS total_expense_vouchers_count, "
            "COALESCE(SUM(gross_amount_inr), 0) AS total_expenses_amount_inr, "
            "COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN net_payable_amount_inr ELSE 0 END), 0) AS paid_expenses_amount_inr, "
            "COALESCE(SUM(CASE WHEN payment_status != 'PAID' THEN net_payable_amount_inr ELSE 0 END), 0) AS pending_expenses_amount_inr "
            "FROM society_expense_vouchers "
            "WHERE society_id = %s"
        )
        database_cursor.execute(expense_summary_query, (str(society_id),))
        expense_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Top Expense Categories breakdown
        expense_heads_query: str = (
            "SELECT "
            "h.head_name, h.category_code, "
            "COALESCE(SUM(v.gross_amount_inr), 0) AS head_total_inr "
            "FROM society_expense_vouchers v "
            "JOIN society_expense_heads h ON v.expense_head_id = h.expense_head_id "
            "WHERE v.society_id = %s "
            "GROUP BY h.expense_head_id, h.head_name, h.category_code "
            "ORDER BY head_total_inr DESC LIMIT 4"
        )
        database_cursor.execute(expense_heads_query, (str(society_id),))
        top_expense_categories: List[Dict[str, Any]] = database_cursor.fetchall() or []

        # Recent Expense Vouchers (latest 4)
        recent_vouchers_query: str = (
            "SELECT "
            "v.voucher_id, v.voucher_number, v.voucher_date, v.gross_amount_inr, "
            "v.net_payable_amount_inr, v.payment_mode, v.payment_status, "
            "ven.vendor_name, h.head_name "
            "FROM society_expense_vouchers v "
            "LEFT JOIN society_vendors ven ON v.vendor_id = ven.vendor_id "
            "LEFT JOIN society_expense_heads h ON v.expense_head_id = h.expense_head_id "
            "WHERE v.society_id = %s "
            "ORDER BY v.voucher_date DESC, v.voucher_id DESC LIMIT 4"
        )
        database_cursor.execute(recent_vouchers_query, (str(society_id),))
        recent_expense_vouchers: List[Dict[str, Any]] = database_cursor.fetchall() or []

        # Top Overdue Maintenance Invoices (flats with highest pending dues)
        overdue_invoices_query: str = (
            "SELECT "
            "i.invoice_id, i.invoice_number, i.billing_period_label, "
            "i.total_invoice_amount_inr, i.paid_amount_inr, i.outstanding_balance_inr, "
            "i.payment_status, i.due_date, "
            "f.flat_number, w.wing_name "
            "FROM flat_invoices i "
            "JOIN flats f ON i.flat_id = f.flat_id "
            "JOIN wings w ON f.wing_id = w.wing_id "
            "WHERE i.society_id = %s AND i.outstanding_balance_inr > 0 "
            "ORDER BY i.outstanding_balance_inr DESC, i.invoice_id ASC LIMIT 4"
        )
        database_cursor.execute(overdue_invoices_query, (society_id,))
        top_overdue_invoices: List[Dict[str, Any]] = database_cursor.fetchall() or []

        # Recent campus visitor activity (latest 5)
        recent_visitors_query: str = (
            "SELECT vl.visit_log_id, vl.visitor_full_name, vl.visitor_phone_number, "
            "vl.visitor_category, vl.company_brand_name, vl.vehicle_registration_number, "
            "vl.approval_status, vl.entry_timestamp, vl.exit_timestamp, "
            "f.flat_number, w.wing_name "
            "FROM visit_logs vl "
            "LEFT JOIN flats f ON vl.flat_id = f.flat_id "
            "LEFT JOIN wings w ON f.wing_id = w.wing_id "
            "WHERE vl.society_id = %s "
            "ORDER BY vl.visit_log_id DESC LIMIT 5"
        )
        database_cursor.execute(recent_visitors_query, (society_id,))
        recent_visitor_records = database_cursor.fetchall() or []

        # High-priority / active helpdesk tickets (latest 4)
        recent_tickets_query: str = (
            "SELECT ticket_id, ticket_number, title, priority, status, wing_name, flat_number, created_at "
            "FROM helpdesk_tickets WHERE society_id = %s "
            "ORDER BY CASE priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, ticket_id DESC "
            "LIMIT 4"
        )
        database_cursor.execute(recent_tickets_query, (society_id,))
        recent_ticket_records = database_cursor.fetchall() or []

        # Recent notices (latest 3)
        recent_notices_query: str = (
            "SELECT notice_id, notice_title, notice_body_content, created_at "
            "FROM notices WHERE society_id = %s "
            "ORDER BY notice_id DESC LIMIT 3"
        )
        database_cursor.execute(recent_notices_query, (society_id,))
        recent_notice_records = database_cursor.fetchall() or []

        return {
            "total_flats_count": int(flats_metrics.get("total_flats_count") or 0),
            "owner_occupied_count": int(flats_metrics.get("owner_occupied_count") or 0),
            "tenant_occupied_count": int(flats_metrics.get("tenant_occupied_count") or 0),
            "vacant_flats_count": int(flats_metrics.get("vacant_flats_count") or 0),
            "total_residents_count": int(residents_metrics.get("total_residents_count") or 0),
            "total_guards_count": int(guards_metrics.get("total_guards_count") or 0),
            "total_gates_count": int(gates_metrics.get("total_gates_count") or 0),
            "active_campus_visitors_count": int(active_visitors_metrics.get("active_campus_visitors_count") or 0),
            "total_notices_count": int(notices_metrics.get("total_notices_count") or 0),
            "pending_approvals_count": int(pending_approvals_metrics.get("pending_approvals_count") or 0),
            "open_helpdesk_tickets_count": int(open_tickets_metrics.get("open_helpdesk_tickets_count") or 0),
            "total_active_staff_count": int(staff_metrics.get("total_active_staff_count") or 0),
            "staff_on_campus_count": int(staff_on_campus_metrics.get("staff_on_campus_count") or 0),
            "total_billed_amount_inr": float(billing_metrics.get("total_billed_amount_inr") or 0.0),
            "total_collected_amount_inr": float(billing_metrics.get("total_collected_amount_inr") or 0.0),
            "total_due_amount_inr": float(billing_metrics.get("total_due_amount_inr") or 0.0),
            "overdue_invoices_count": int(billing_metrics.get("overdue_invoices_count") or 0),
            "paid_invoices_count": int(billing_metrics.get("paid_invoices_count") or 0),
            "total_invoices_count": int(billing_metrics.get("total_invoices_count") or 0),
            "total_expenses_amount_inr": float(expense_metrics.get("total_expenses_amount_inr") or 0.0),
            "paid_expenses_amount_inr": float(expense_metrics.get("paid_expenses_amount_inr") or 0.0),
            "pending_expenses_amount_inr": float(expense_metrics.get("pending_expenses_amount_inr") or 0.0),
            "total_expense_vouchers_count": int(expense_metrics.get("total_expense_vouchers_count") or 0),
            "top_expense_categories": top_expense_categories,
            "recent_expense_vouchers": recent_expense_vouchers,
            "top_overdue_invoices": top_overdue_invoices,
            "recent_visitors": recent_visitor_records,
            "recent_tickets": recent_ticket_records,
            "recent_notices": recent_notice_records,
        }

    # -------------------------------------------------------------------------
    # DIGITAL NOTICE BOARD
    # -------------------------------------------------------------------------

    def get_all_notices_for_society(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> List[Dict[str, Any]]:
        select_notices_query: str = (
            "SELECT n.notice_id, n.society_id, n.notice_title, n.notice_body_content, "
            "n.published_by_admin_user_id, n.created_at, u.full_name AS publisher_name "
            "FROM notices n "
            "JOIN users u ON n.published_by_admin_user_id = u.user_id "
            "WHERE n.society_id = %s "
            "ORDER BY n.created_at DESC"
        )
        database_cursor.execute(select_notices_query, (society_id,))
        return database_cursor.fetchall()

    def insert_notice(
        self,
        database_cursor: DictCursor,
        society_id: int,
        notice_title: str,
        notice_body_content: str,
        published_by_admin_user_id: int,
    ) -> int:
        insert_notice_query: str = (
            "INSERT INTO notices ("
            "society_id, notice_title, notice_body_content, published_by_admin_user_id"
            ") VALUES (%s, %s, %s, %s)"
        )
        database_cursor.execute(
            insert_notice_query,
            (
                society_id,
                notice_title,
                notice_body_content,
                published_by_admin_user_id,
            ),
        )
        return database_cursor.lastrowid

    # -------------------------------------------------------------------------
    # FLAT OWNERSHIP TRANSFERS & HISTORICAL AUDIT
    # -------------------------------------------------------------------------

    def insert_flat_ownership_history(
        self,
        database_cursor: DictCursor,
        society_id: int,
        flat_id: int,
        previous_owner_user_id: Optional[int],
        previous_owner_name: str,
        previous_owner_phone: Optional[str],
        new_owner_user_id: Optional[int],
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
        recorded_by_admin_user_id: Optional[int] = None,
    ) -> int:
        insert_history_query: str = (
            "INSERT INTO flat_ownership_history ("
            "society_id, flat_id, previous_owner_user_id, previous_owner_name, "
            "previous_owner_phone, new_owner_user_id, new_owner_name, new_owner_phone, "
            "transfer_sale_date, sale_deed_document_url, sale_deed_document_filename, "
            "transfer_remarks, transfer_fee_inr, fee_category, society_development_fund_inr, "
            "payment_mode, payment_reference_number, recorded_by_admin_user_id"
            ") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        )
        database_cursor.execute(
            insert_history_query,
            (
                society_id,
                flat_id,
                previous_owner_user_id,
                previous_owner_name,
                previous_owner_phone,
                new_owner_user_id,
                new_owner_name,
                new_owner_phone,
                transfer_sale_date,
                sale_deed_document_url,
                sale_deed_document_filename,
                transfer_remarks,
                transfer_fee_inr,
                fee_category,
                society_development_fund_inr,
                payment_mode,
                payment_reference_number,
                recorded_by_admin_user_id,
            ),
        )
        return database_cursor.lastrowid

    def get_ownership_history_for_flat(
        self,
        database_cursor: DictCursor,
        society_id: int,
        flat_id: int,
    ) -> List[Dict[str, Any]]:
        select_history_query: str = (
            "SELECT h.history_id, h.society_id, h.flat_id, h.previous_owner_user_id, "
            "h.previous_owner_name, h.previous_owner_phone, h.new_owner_user_id, "
            "h.new_owner_name, h.new_owner_phone, h.transfer_sale_date, "
            "h.sale_deed_document_url, h.sale_deed_document_filename, "
            "h.transfer_remarks, h.transfer_fee_inr, h.fee_category, "
            "h.society_development_fund_inr, h.payment_mode, h.payment_reference_number, "
            "h.recorded_by_admin_user_id, h.created_at, u.full_name AS admin_recorder_name "
            "FROM flat_ownership_history h "
            "LEFT JOIN users u ON h.recorded_by_admin_user_id = u.user_id "
            "WHERE h.society_id = %s AND h.flat_id = %s "
            "ORDER BY h.transfer_sale_date DESC, h.history_id DESC"
        )
        database_cursor.execute(select_history_query, (society_id, flat_id))
        return database_cursor.fetchall()

    def deactivate_owner_and_family_members(
        self,
        database_cursor: DictCursor,
        society_id: int,
        flat_id: int,
        new_owner_user_id: int,
    ) -> int:
        """
        Marks all previous active owners and their family members for the flat as PAST_OWNER and inactive,
        except the newly assigned owner.
        """
        update_users_query: str = (
            "UPDATE users SET "
            "resident_type = 'PAST_OWNER', "
            "is_active = FALSE "
            "WHERE society_id = %s AND flat_id = %s AND user_id != %s AND ("
            "resident_type IN ('OWNER', 'OWNER_FAMILY', 'FAMILY_MEMBER')"
            ")"
        )
        database_cursor.execute(
            update_users_query, (society_id, flat_id, new_owner_user_id)
        )
        return database_cursor.rowcount
