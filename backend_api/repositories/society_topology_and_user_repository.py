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
        Finds user accounts matching phone number.
        If society_id is provided, filters by that society or global accounts (society_id IS NULL).
        """
        if society_id is not None:
            select_users_query: str = (
                "SELECT user_id, society_id, flat_id, full_name, phone_number, "
                "password_hash, user_role, resident_type, approval_status, "
                "bootstrap_activation_token, is_bootstrap_pending, is_active "
                "FROM users "
                "WHERE phone_number = %s AND (society_id = %s OR society_id IS NULL)"
            )
            database_cursor.execute(select_users_query, (phone_number, society_id))
        else:
            select_users_query: str = (
                "SELECT user_id, society_id, flat_id, full_name, phone_number, "
                "password_hash, user_role, resident_type, approval_status, "
                "bootstrap_activation_token, is_bootstrap_pending, is_active "
                "FROM users "
                "WHERE phone_number = %s"
            )
            database_cursor.execute(select_users_query, (phone_number,))

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
            "u.user_role, u.resident_type, u.approval_status, u.is_active, u.created_at, "
            "f.flat_number, w.wing_name "
            "FROM users u "
            "LEFT JOIN flats f ON u.flat_id = f.flat_id "
            "LEFT JOIN wings w ON f.wing_id = w.wing_id "
            "WHERE u.society_id = %s AND u.user_role = 'RESIDENT' "
            "ORDER BY w.wing_name ASC, f.flat_number ASC, u.full_name ASC"
        )
        database_cursor.execute(select_residents_query, (society_id,))
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
