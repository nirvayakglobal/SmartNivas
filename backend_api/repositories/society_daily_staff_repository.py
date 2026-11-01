"""
Smart Nivas - Society Daily Staff & Helper Repository
Handles database access for domestic staff rosters, flat assignments, attendance logs, blacklist audit, and access configuration.
"""

from typing import List, Dict, Any, Optional
import uuid
from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
)


class SocietyDailyStaffRepository:
    def __init__(self, connection_manager=None):
        self.connection_manager = (
            connection_manager or global_database_connection_manager
        )

    # ----------------------------------------------------
    # Society Staff Configuration
    # ----------------------------------------------------
    def get_staff_config(self, society_id: str) -> Dict[str, Any]:
        query = """
            SELECT 
                config_id,
                society_id,
                enforce_mandatory_id_proof,
                enforce_mandatory_police_verification,
                daily_entry_start_time,
                daily_entry_cutoff_time,
                allow_emergency_night_entry,
                updated_at
            FROM society_staff_config
            WHERE society_id = %s
        """
        with self.connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, (str(society_id),))
            row = cursor.fetchone()
            if not row:
                # Insert default if not present
                new_id = str(uuid.uuid4())
                cursor.execute(
                    """
                    INSERT INTO society_staff_config 
                    (config_id, society_id, enforce_mandatory_id_proof, enforce_mandatory_police_verification, daily_entry_start_time, daily_entry_cutoff_time, allow_emergency_night_entry)
                    VALUES (%s, %s, TRUE, FALSE, '06:00:00', '22:00:00', FALSE)
                    """,
                    (new_id, str(society_id)),
                )
                return {
                    "config_id": new_id,
                    "society_id": str(society_id),
                    "enforce_mandatory_id_proof": True,
                    "enforce_mandatory_police_verification": False,
                    "daily_entry_start_time": "06:00",
                    "daily_entry_cutoff_time": "22:00",
                    "allow_emergency_night_entry": False,
                }
            return {
                "config_id": row["config_id"],
                "society_id": str(row["society_id"]),
                "enforce_mandatory_id_proof": bool(row["enforce_mandatory_id_proof"]),
                "enforce_mandatory_police_verification": bool(row["enforce_mandatory_police_verification"]),
                "daily_entry_start_time": str(row["daily_entry_start_time"])[:5] if row["daily_entry_start_time"] is not None else "06:00",
                "daily_entry_cutoff_time": str(row["daily_entry_cutoff_time"])[:5] if row["daily_entry_cutoff_time"] is not None else "22:00",
                "allow_emergency_night_entry": bool(row["allow_emergency_night_entry"]),
            }

    def update_staff_config(
        self,
        society_id: str,
        enforce_mandatory_id_proof: bool,
        enforce_mandatory_police_verification: bool,
        daily_entry_start_time: str,
        daily_entry_cutoff_time: str,
        allow_emergency_night_entry: bool,
    ) -> Dict[str, Any]:
        query = """
            INSERT INTO society_staff_config 
            (config_id, society_id, enforce_mandatory_id_proof, enforce_mandatory_police_verification, daily_entry_start_time, daily_entry_cutoff_time, allow_emergency_night_entry)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                enforce_mandatory_id_proof = VALUES(enforce_mandatory_id_proof),
                enforce_mandatory_police_verification = VALUES(enforce_mandatory_police_verification),
                daily_entry_start_time = VALUES(daily_entry_start_time),
                daily_entry_cutoff_time = VALUES(daily_entry_cutoff_time),
                allow_emergency_night_entry = VALUES(allow_emergency_night_entry)
        """
        config_id = str(uuid.uuid4())
        with self.connection_manager.database_transaction_scope() as cursor:
            cursor.execute(
                query,
                (
                    config_id,
                    str(society_id),
                    enforce_mandatory_id_proof,
                    enforce_mandatory_police_verification,
                    daily_entry_start_time,
                    daily_entry_cutoff_time,
                    allow_emergency_night_entry,
                ),
            )
        return self.get_staff_config(society_id)

    # ----------------------------------------------------
    # Staff Roster Management
    # ----------------------------------------------------
    def get_staff_members(
        self,
        society_id: str,
        role_category: Optional[str] = None,
        status: Optional[str] = None,
        search_query: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        conditions = ["society_id = %s"]
        params: List[Any] = [str(society_id)]

        if role_category and role_category != "ALL":
            conditions.append("role_category = %s")
            params.append(role_category)

        if status and status != "ALL":
            conditions.append("status = %s")
            params.append(status)

        if search_query:
            conditions.append("(full_name LIKE %s OR phone_number LIKE %s)")
            wildcard = f"%{search_query.strip()}%"
            params.extend([wildcard, wildcard])

        where_clause = " WHERE " + " AND ".join(conditions)
        query = f"""
            SELECT 
                staff_id, society_id, full_name, phone_number, role_category,
                gender, photo_url, id_proof_type, id_proof_number,
                id_proof_document_url, is_id_proof_verified,
                police_verification_status, police_verification_doc_url,
                police_verification_date, status, emergency_contact_name,
                emergency_contact_phone, created_at, updated_at
            FROM society_daily_staff
            {where_clause}
            ORDER BY full_name ASC
        """

        with self.connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, tuple(params))
            staff_rows = cursor.fetchall()
            if not staff_rows:
                return []

            staff_ids = [row["staff_id"] for row in staff_rows]
            
            # Fetch assignments for all retrieved staff members
            format_strings = ",".join(["%s"] * len(staff_ids))
            assignment_query = f"""
                SELECT assignment_id, staff_id, flat_id, flat_number, resident_name, resident_phone, start_date, is_active
                FROM society_staff_flat_assignments
                WHERE staff_id IN ({format_strings}) AND is_active = TRUE
                ORDER BY flat_number ASC
            """
            cursor.execute(assignment_query, tuple(staff_ids))
            assignments = cursor.fetchall()

            # Group assignments by staff_id
            assign_map: Dict[str, List[Dict[str, Any]]] = {sid: [] for sid in staff_ids}
            for a in assignments:
                assign_map[a["staff_id"]].append({
                    "assignment_id": a["assignment_id"],
                    "flat_id": a["flat_id"],
                    "flat_number": a["flat_number"],
                    "resident_name": a["resident_name"],
                    "resident_phone": a["resident_phone"],
                    "start_date": str(a["start_date"]),
                })

            # Check if staff is currently inside society (checked in with NULL exit_timestamp)
            active_log_query = f"""
                SELECT staff_id, log_id, entry_timestamp, entry_gate
                FROM society_staff_attendance_logs
                WHERE staff_id IN ({format_strings}) AND exit_timestamp IS NULL
            """
            cursor.execute(active_log_query, tuple(staff_ids))
            inside_logs = {row["staff_id"]: row for row in cursor.fetchall()}

            result = []
            for row in staff_rows:
                sid = row["staff_id"]
                inside_info = inside_logs.get(sid)
                result.append({
                    "staff_id": sid,
                    "society_id": str(row["society_id"]),
                    "full_name": row["full_name"],
                    "phone_number": row["phone_number"],
                    "role_category": row["role_category"],
                    "gender": row["gender"],
                    "photo_url": row["photo_url"],
                    "id_proof_type": row["id_proof_type"],
                    "id_proof_number": row["id_proof_number"],
                    "id_proof_document_url": row["id_proof_document_url"],
                    "is_id_proof_verified": bool(row["is_id_proof_verified"]),
                    "police_verification_status": row["police_verification_status"],
                    "police_verification_doc_url": row["police_verification_doc_url"],
                    "police_verification_date": str(row["police_verification_date"]) if row["police_verification_date"] else None,
                    "status": row["status"],
                    "emergency_contact_name": row["emergency_contact_name"],
                    "emergency_contact_phone": row["emergency_contact_phone"],
                    "created_at": str(row["created_at"]),
                    "updated_at": str(row["updated_at"]),
                    "assigned_flats": assign_map.get(sid, []),
                    "is_currently_inside": inside_info is not None,
                    "current_entry_timestamp": str(inside_info["entry_timestamp"]) if inside_info else None,
                    "current_entry_gate": inside_info["entry_gate"] if inside_info else None,
                    "active_log_id": inside_info["log_id"] if inside_info else None,
                })
            return result

    def get_staff_by_id(self, society_id: str, staff_id: str) -> Optional[Dict[str, Any]]:
        query = """
            SELECT 
                staff_id, society_id, full_name, phone_number, role_category,
                gender, photo_url, id_proof_type, id_proof_number,
                id_proof_document_url, is_id_proof_verified,
                police_verification_status, police_verification_doc_url,
                police_verification_date, status, emergency_contact_name,
                emergency_contact_phone, created_at, updated_at
            FROM society_daily_staff
            WHERE society_id = %s AND staff_id = %s
        """
        with self.connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, (str(society_id), staff_id))
            row = cursor.fetchone()
            if not row:
                return None

            # Get assignments
            cursor.execute("""
                SELECT assignment_id, staff_id, flat_id, flat_number, resident_name, resident_phone, start_date, is_active
                FROM society_staff_flat_assignments
                WHERE staff_id = %s AND is_active = TRUE
                ORDER BY flat_number ASC
            """, (staff_id,))
            assignments = cursor.fetchall()

            # Check inside status
            cursor.execute("""
                SELECT log_id, entry_timestamp, entry_gate
                FROM society_staff_attendance_logs
                WHERE staff_id = %s AND exit_timestamp IS NULL
                ORDER BY entry_timestamp DESC LIMIT 1
            """, (staff_id,))
            inside_info = cursor.fetchone()

            return {
                "staff_id": row["staff_id"],
                "society_id": str(row["society_id"]),
                "full_name": row["full_name"],
                "phone_number": row["phone_number"],
                "role_category": row["role_category"],
                "gender": row["gender"],
                "photo_url": row["photo_url"],
                "id_proof_type": row["id_proof_type"],
                "id_proof_number": row["id_proof_number"],
                "id_proof_document_url": row["id_proof_document_url"],
                "is_id_proof_verified": bool(row["is_id_proof_verified"]),
                "police_verification_status": row["police_verification_status"],
                "police_verification_doc_url": row["police_verification_doc_url"],
                "police_verification_date": str(row["police_verification_date"]) if row["police_verification_date"] else None,
                "status": row["status"],
                "emergency_contact_name": row["emergency_contact_name"],
                "emergency_contact_phone": row["emergency_contact_phone"],
                "created_at": str(row["created_at"]),
                "updated_at": str(row["updated_at"]),
                "assigned_flats": [
                    {
                        "assignment_id": a["assignment_id"],
                        "flat_id": a["flat_id"],
                        "flat_number": a["flat_number"],
                        "resident_name": a["resident_name"],
                        "resident_phone": a["resident_phone"],
                        "start_date": str(a["start_date"]),
                    }
                    for a in assignments
                ],
                "is_currently_inside": inside_info is not None,
                "current_entry_timestamp": str(inside_info["entry_timestamp"]) if inside_info else None,
                "current_entry_gate": inside_info["entry_gate"] if inside_info else None,
                "active_log_id": inside_info["log_id"] if inside_info else None,
            }

    def create_staff(self, staff_data: Dict[str, Any]) -> str:
        staff_id = staff_data.get("staff_id") or str(uuid.uuid4())
        query = """
            INSERT INTO society_daily_staff (
                staff_id, society_id, full_name, phone_number, role_category,
                gender, photo_url, id_proof_type, id_proof_number,
                id_proof_document_url, is_id_proof_verified,
                police_verification_status, police_verification_doc_url,
                police_verification_date, status, emergency_contact_name,
                emergency_contact_phone
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        with self.connection_manager.database_transaction_scope() as cursor:
            cursor.execute(
                query,
                (
                    staff_id,
                    str(staff_data["society_id"]),
                    staff_data["full_name"],
                    staff_data["phone_number"],
                    staff_data.get("role_category", "Maid"),
                    staff_data.get("gender", "Female"),
                    staff_data.get("photo_url"),
                    staff_data.get("id_proof_type", "Aadhaar"),
                    staff_data.get("id_proof_number"),
                    staff_data.get("id_proof_document_url"),
                    bool(staff_data.get("is_id_proof_verified", False)),
                    staff_data.get("police_verification_status", "Pending"),
                    staff_data.get("police_verification_doc_url"),
                    staff_data.get("police_verification_date"),
                    staff_data.get("status", "Pending_KYC"),
                    staff_data.get("emergency_contact_name"),
                    staff_data.get("emergency_contact_phone"),
                ),
            )

            # Insert flat assignments if provided
            flats = staff_data.get("assigned_flats", [])
            for flt in flats:
                assign_id = str(uuid.uuid4())
                cursor.execute(
                    """
                    INSERT INTO society_staff_flat_assignments 
                    (assignment_id, society_id, staff_id, flat_id, flat_number, resident_name, resident_phone, start_date, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_DATE(), TRUE)
                    """,
                    (
                        assign_id,
                        str(staff_data["society_id"]),
                        staff_id,
                        flt.get("flat_id"),
                        flt.get("flat_number", ""),
                        flt.get("resident_name"),
                        flt.get("resident_phone"),
                    ),
                )
        return staff_id

    def update_staff(self, society_id: str, staff_id: str, update_data: Dict[str, Any]) -> bool:
        allowed_fields = [
            "full_name", "phone_number", "role_category", "gender", "photo_url",
            "id_proof_type", "id_proof_number", "id_proof_document_url",
            "is_id_proof_verified", "police_verification_status",
            "police_verification_doc_url", "police_verification_date",
            "status", "emergency_contact_name", "emergency_contact_phone",
        ]
        updates = []
        params = []
        for field in allowed_fields:
            if field in update_data:
                updates.append(f"{field} = %s")
                params.append(update_data[field])

        if not updates and "assigned_flats" not in update_data:
            return False

        with self.connection_manager.database_transaction_scope() as cursor:
            if updates:
                query = f"UPDATE society_daily_staff SET {', '.join(updates)} WHERE society_id = %s AND staff_id = %s"
                params.extend([str(society_id), staff_id])
                cursor.execute(query, tuple(params))

            if "assigned_flats" in update_data:
                # Mark previous assignments inactive
                cursor.execute(
                    "UPDATE society_staff_flat_assignments SET is_active = FALSE WHERE staff_id = %s",
                    (staff_id,),
                )
                for flt in update_data["assigned_flats"]:
                    assign_id = str(uuid.uuid4())
                    cursor.execute(
                        """
                        INSERT INTO society_staff_flat_assignments 
                        (assignment_id, society_id, staff_id, flat_id, flat_number, resident_name, resident_phone, start_date, is_active)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_DATE(), TRUE)
                        """,
                        (
                            assign_id,
                            str(society_id),
                            staff_id,
                            flt.get("flat_id"),
                            flt.get("flat_number", ""),
                            flt.get("resident_name"),
                            flt.get("resident_phone"),
                        ),
                    )
        return True

    # ----------------------------------------------------
    # Blacklist Management & Audit
    # ----------------------------------------------------
    def blacklist_staff(
        self,
        society_id: str,
        staff_id: str,
        reason: str,
        admin_id: str,
        admin_name: str,
    ) -> bool:
        with self.connection_manager.database_transaction_scope() as cursor:
            # 1. Fetch staff info
            cursor.execute(
                "SELECT full_name, phone_number, role_category FROM society_daily_staff WHERE society_id = %s AND staff_id = %s",
                (str(society_id), staff_id),
            )
            staff = cursor.fetchone()
            if not staff:
                return False

            # 2. Update status to Blacklisted
            cursor.execute(
                "UPDATE society_daily_staff SET status = 'Blacklisted' WHERE society_id = %s AND staff_id = %s",
                (str(society_id), staff_id),
            )

            # 3. Force check-out if currently inside
            cursor.execute(
                """
                UPDATE society_staff_attendance_logs 
                SET exit_timestamp = NOW(), remarks = 'Force exit: blacklisted by admin'
                WHERE society_id = %s AND staff_id = %s AND exit_timestamp IS NULL
                """,
                (str(society_id), staff_id),
            )

            # 4. Insert Blacklist Audit Log
            audit_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO society_staff_blacklist_audit 
                (audit_id, society_id, staff_id, staff_name, phone_number, role_category, action_type, reason, reported_by_admin_id, reported_by_admin_name)
                VALUES (%s, %s, %s, %s, %s, %s, 'Blacklist', %s, %s, %s)
                """,
                (
                    audit_id,
                    str(society_id),
                    staff_id,
                    staff["full_name"],
                    staff["phone_number"],
                    staff["role_category"],
                    reason,
                    str(admin_id),
                    admin_name,
                ),
            )
        return True

    def unblacklist_staff(
        self,
        society_id: str,
        staff_id: str,
        reason: str,
        admin_id: str,
        admin_name: str,
        new_status: str = "Active",
    ) -> bool:
        with self.connection_manager.database_transaction_scope() as cursor:
            cursor.execute(
                "SELECT full_name, phone_number, role_category FROM society_daily_staff WHERE society_id = %s AND staff_id = %s",
                (str(society_id), staff_id),
            )
            staff = cursor.fetchone()
            if not staff:
                return False

            cursor.execute(
                "UPDATE society_daily_staff SET status = %s WHERE society_id = %s AND staff_id = %s",
                (new_status, str(society_id), staff_id),
            )

            audit_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO society_staff_blacklist_audit 
                (audit_id, society_id, staff_id, staff_name, phone_number, role_category, action_type, reason, reported_by_admin_id, reported_by_admin_name)
                VALUES (%s, %s, %s, %s, %s, %s, 'Unblacklist', %s, %s, %s)
                """,
                (
                    audit_id,
                    str(society_id),
                    staff_id,
                    staff["full_name"],
                    staff["phone_number"],
                    staff["role_category"],
                    reason,
                    str(admin_id),
                    admin_name,
                ),
            )
        return True

    def get_blacklist_audit_logs(self, society_id: str) -> List[Dict[str, Any]]:
        query = """
            SELECT 
                audit_id, society_id, staff_id, staff_name, phone_number,
                role_category, action_type, reason, reported_by_admin_id,
                reported_by_admin_name, action_timestamp
            FROM society_staff_blacklist_audit
            WHERE society_id = %s
            ORDER BY action_timestamp DESC
        """
        with self.connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, (str(society_id),))
            rows = cursor.fetchall()
            return [
                {
                    "audit_id": r["audit_id"],
                    "society_id": str(r["society_id"]),
                    "staff_id": r["staff_id"],
                    "staff_name": r["staff_name"],
                    "phone_number": r["phone_number"],
                    "role_category": r["role_category"],
                    "action_type": r["action_type"],
                    "reason": r["reason"],
                    "reported_by_admin_id": r["reported_by_admin_id"],
                    "reported_by_admin_name": r["reported_by_admin_name"],
                    "action_timestamp": str(r["action_timestamp"]),
                }
                for r in rows
            ]

    # ----------------------------------------------------
    # Gate Attendance Management
    # ----------------------------------------------------
    def log_gate_entry(
        self,
        society_id: str,
        staff_id: str,
        entry_gate: str = "Main Gate",
        guard_id: Optional[str] = None,
        remarks: Optional[str] = None,
    ) -> Dict[str, Any]:
        with self.connection_manager.database_transaction_scope() as cursor:
            # 1. Check if staff exists and verify status
            cursor.execute(
                "SELECT staff_id, full_name, role_category, status FROM society_daily_staff WHERE society_id = %s AND staff_id = %s",
                (str(society_id), staff_id),
            )
            staff = cursor.fetchone()
            if not staff:
                raise ValueError("Staff member not found.")

            if staff["status"] == "Blacklisted":
                raise ValueError("Gate entry DENIED: Staff member is BLACKLISTED.")

            if staff["status"] != "Active":
                raise ValueError(f"Gate entry DENIED: Staff status is '{staff['status']}', not Active.")

            # 2. Check if already checked in
            cursor.execute(
                "SELECT log_id, entry_timestamp FROM society_staff_attendance_logs WHERE staff_id = %s AND exit_timestamp IS NULL",
                (staff_id,),
            )
            existing_active = cursor.fetchone()
            if existing_active:
                raise ValueError(f"Staff member is already checked in at {existing_active['entry_timestamp']}.")

            # 3. Retrieve assigned flats
            cursor.execute(
                "SELECT flat_number FROM society_staff_flat_assignments WHERE staff_id = %s AND is_active = TRUE",
                (staff_id,),
            )
            flat_rows = cursor.fetchall()
            flats_visited_str = ", ".join([f["flat_number"] for f in flat_rows]) if flat_rows else "None"

            # 4. Insert log
            log_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO society_staff_attendance_logs
                (log_id, society_id, staff_id, staff_name, role_category, entry_gate, entry_timestamp, checked_in_by_guard_id, flats_visited, remarks)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s)
                """,
                (
                    log_id,
                    str(society_id),
                    staff_id,
                    staff["full_name"],
                    staff["role_category"],
                    entry_gate,
                    guard_id,
                    flats_visited_str,
                    remarks,
                ),
            )

            # Return the created record
            cursor.execute("SELECT * FROM society_staff_attendance_logs WHERE log_id = %s", (log_id,))
            created_log = cursor.fetchone()
            return {
                "log_id": created_log["log_id"],
                "society_id": str(created_log["society_id"]),
                "staff_id": created_log["staff_id"],
                "staff_name": created_log["staff_name"],
                "role_category": created_log["role_category"],
                "entry_gate": created_log["entry_gate"],
                "entry_timestamp": str(created_log["entry_timestamp"]),
                "exit_timestamp": None,
                "flats_visited": created_log["flats_visited"],
                "remarks": created_log["remarks"],
            }

    def log_gate_exit(
        self,
        society_id: str,
        staff_id: str,
        exit_gate: str = "Main Gate",
        guard_id: Optional[str] = None,
        remarks: Optional[str] = None,
    ) -> Dict[str, Any]:
        with self.connection_manager.database_transaction_scope() as cursor:
            cursor.execute(
                """
                SELECT log_id, entry_timestamp, staff_name, role_category
                FROM society_staff_attendance_logs
                WHERE society_id = %s AND staff_id = %s AND exit_timestamp IS NULL
                ORDER BY entry_timestamp DESC LIMIT 1
                """,
                (str(society_id), staff_id),
            )
            active_log = cursor.fetchone()
            if not active_log:
                raise ValueError("Staff member does not have an active check-in entry.")

            log_id = active_log["log_id"]
            cursor.execute(
                """
                UPDATE society_staff_attendance_logs
                SET exit_timestamp = NOW(), exit_gate = %s, checked_out_by_guard_id = %s, remarks = COALESCE(%s, remarks)
                WHERE log_id = %s
                """,
                (exit_gate, guard_id, remarks, log_id),
            )

            cursor.execute("SELECT * FROM society_staff_attendance_logs WHERE log_id = %s", (log_id,))
            updated_log = cursor.fetchone()
            return {
                "log_id": updated_log["log_id"],
                "society_id": str(updated_log["society_id"]),
                "staff_id": updated_log["staff_id"],
                "staff_name": updated_log["staff_name"],
                "role_category": updated_log["role_category"],
                "entry_gate": updated_log["entry_gate"],
                "entry_timestamp": str(updated_log["entry_timestamp"]),
                "exit_gate": updated_log["exit_gate"],
                "exit_timestamp": str(updated_log["exit_timestamp"]),
                "flats_visited": updated_log["flats_visited"],
                "remarks": updated_log["remarks"],
            }

    def get_live_attendance_feed(self, society_id: str) -> List[Dict[str, Any]]:
        query = """
            SELECT 
                l.log_id, l.society_id, l.staff_id, l.staff_name, l.role_category,
                l.entry_gate, l.entry_timestamp, l.flats_visited, l.remarks,
                s.phone_number, s.photo_url, s.gender,
                TIMESTAMPDIFF(MINUTE, l.entry_timestamp, NOW()) as minutes_inside
            FROM society_staff_attendance_logs l
            JOIN society_daily_staff s ON l.staff_id = s.staff_id
            WHERE l.society_id = %s AND l.exit_timestamp IS NULL
            ORDER BY l.entry_timestamp DESC
        """
        with self.connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, (str(society_id),))
            rows = cursor.fetchall()
            return [
                {
                    "log_id": r["log_id"],
                    "society_id": str(r["society_id"]),
                    "staff_id": r["staff_id"],
                    "staff_name": r["staff_name"],
                    "role_category": r["role_category"],
                    "entry_gate": r["entry_gate"],
                    "entry_timestamp": str(r["entry_timestamp"]),
                    "flats_visited": r["flats_visited"],
                    "remarks": r["remarks"],
                    "phone_number": r["phone_number"],
                    "photo_url": r["photo_url"],
                    "gender": r["gender"],
                    "minutes_inside": r["minutes_inside"],
                }
                for r in rows
            ]

    def get_daily_attendance_report(
        self,
        society_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        role_category: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        conditions = ["l.society_id = %s"]
        params: List[Any] = [str(society_id)]

        if start_date:
            conditions.append("DATE(l.entry_timestamp) >= %s")
            params.append(start_date)

        if end_date:
            conditions.append("DATE(l.entry_timestamp) <= %s")
            params.append(end_date)

        if role_category and role_category != "ALL":
            conditions.append("l.role_category = %s")
            params.append(role_category)

        where_clause = " WHERE " + " AND ".join(conditions)
        query = f"""
            SELECT 
                l.log_id, l.society_id, l.staff_id, l.staff_name, l.role_category,
                l.entry_gate, l.entry_timestamp, l.exit_gate, l.exit_timestamp,
                l.flats_visited, l.remarks, l.is_overstay,
                s.phone_number,
                TIMESTAMPDIFF(MINUTE, l.entry_timestamp, COALESCE(l.exit_timestamp, NOW())) as total_minutes_logged
            FROM society_staff_attendance_logs l
            JOIN society_daily_staff s ON l.staff_id = s.staff_id
            {where_clause}
            ORDER BY l.entry_timestamp DESC
        """
        with self.connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            return [
                {
                    "log_id": r["log_id"],
                    "society_id": str(r["society_id"]),
                    "staff_id": r["staff_id"],
                    "staff_name": r["staff_name"],
                    "phone_number": r["phone_number"],
                    "role_category": r["role_category"],
                    "entry_gate": r["entry_gate"],
                    "entry_timestamp": str(r["entry_timestamp"]),
                    "exit_gate": r["exit_gate"],
                    "exit_timestamp": str(r["exit_timestamp"]) if r["exit_timestamp"] else None,
                    "flats_visited": r["flats_visited"],
                    "remarks": r["remarks"],
                    "is_overstay": bool(r["is_overstay"]),
                    "total_minutes_logged": r["total_minutes_logged"],
                    "status_label": "Inside Society" if not r["exit_timestamp"] else "Completed",
                }
                for r in rows
            ]
