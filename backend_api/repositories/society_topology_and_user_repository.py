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
            "AND approval_status IN ('APPROVED_ENTRY', 'INSIDE_CAMPUS')"
        )
        database_cursor.execute(active_visitors_query, (society_id,))
        active_visitors_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

        # Notices count
        notices_query: str = (
            "SELECT COUNT(*) AS total_notices_count FROM notices WHERE society_id = %s"
        )
        database_cursor.execute(notices_query, (society_id,))
        notices_metrics: Dict[str, Any] = database_cursor.fetchone() or {}

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
