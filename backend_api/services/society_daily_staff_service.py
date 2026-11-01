"""
Smart Nivas - Society Daily Staff & Helper Service
Coordinates business logic for:
- KYC validation (ID proof & Police verification enforcement)
- Access timing rule enforcement (e.g. no entry past 10:00 PM)
- Blacklisting with mandatory reason audits
- Roster lifecycle and gate check-in/out
- Timesheet reporting and CSV exports
"""

from typing import List, Dict, Any, Optional
import datetime
import io
import csv
from backend_api.repositories.society_daily_staff_repository import SocietyDailyStaffRepository


class SocietyDailyStaffService:
    def __init__(self, repository: Optional[SocietyDailyStaffRepository] = None):
        self.repository = repository or SocietyDailyStaffRepository()

    # ----------------------------------------------------
    # Configuration
    # ----------------------------------------------------
    def get_staff_config(self, society_id: str) -> Dict[str, Any]:
        return self.repository.get_staff_config(society_id)

    def update_staff_config(self, society_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        enforce_id = bool(data.get("enforce_mandatory_id_proof", True))
        enforce_police = bool(data.get("enforce_mandatory_police_verification", False))
        entry_start = data.get("daily_entry_start_time", "06:00")
        entry_cutoff = data.get("daily_entry_cutoff_time", "22:00")
        allow_emergency = bool(data.get("allow_emergency_night_entry", False))

        return self.repository.update_staff_config(
            society_id=society_id,
            enforce_mandatory_id_proof=enforce_id,
            enforce_mandatory_police_verification=enforce_police,
            daily_entry_start_time=entry_start,
            daily_entry_cutoff_time=entry_cutoff,
            allow_emergency_night_entry=allow_emergency,
        )

    # ----------------------------------------------------
    # Roster Management & KYC Validation
    # ----------------------------------------------------
    def get_staff_roster(
        self,
        society_id: str,
        role_category: Optional[str] = None,
        status: Optional[str] = None,
        search_query: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        return self.repository.get_staff_members(
            society_id=society_id,
            role_category=role_category,
            status=status,
            search_query=search_query,
        )

    def get_staff_detail(self, society_id: str, staff_id: str) -> Optional[Dict[str, Any]]:
        return self.repository.get_staff_by_id(society_id, staff_id)

    def register_staff_member(self, society_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Basic validation
        full_name = payload.get("full_name", "").strip()
        phone_number = payload.get("phone_number", "").strip()
        if not full_name:
            raise ValueError("Full name is required.")
        if not phone_number:
            raise ValueError("Phone number is required.")

        # Check KYC rules
        config = self.repository.get_staff_config(society_id)
        is_id_verified = bool(payload.get("is_id_proof_verified", False))
        police_status = payload.get("police_verification_status", "Pending")

        requested_status = payload.get("status", "Pending_KYC")
        if requested_status == "Active":
            self._assert_kyc_compliance(config, is_id_verified, police_status)

        payload["society_id"] = society_id
        staff_id = self.repository.create_staff(payload)
        return self.repository.get_staff_by_id(society_id, staff_id)

    def update_staff_member(self, society_id: str, staff_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.repository.get_staff_by_id(society_id, staff_id)
        if not existing:
            raise ValueError("Staff member not found.")

        # If updating status to Active, assert KYC compliance
        target_status = payload.get("status", existing["status"])
        if target_status == "Active":
            config = self.repository.get_staff_config(society_id)
            is_id_verified = payload.get("is_id_proof_verified", existing["is_id_proof_verified"])
            police_status = payload.get("police_verification_status", existing["police_verification_status"])
            self._assert_kyc_compliance(config, is_id_verified, police_status)

        self.repository.update_staff(society_id, staff_id, payload)
        return self.repository.get_staff_by_id(society_id, staff_id)

    def _assert_kyc_compliance(self, config: Dict[str, Any], is_id_verified: bool, police_status: str):
        if config["enforce_mandatory_id_proof"] and not is_id_verified:
            raise ValueError("Cannot activate staff: Mandatory ID Proof (Aadhaar / Voter ID) must be verified first.")

        if config["enforce_mandatory_police_verification"] and police_status != "Verified":
            raise ValueError("Cannot activate staff: Mandatory Police Verification is not yet verified.")

    # ----------------------------------------------------
    # Blacklist Management
    # ----------------------------------------------------
    def blacklist_staff(
        self,
        society_id: str,
        staff_id: str,
        reason: str,
        admin_id: str,
        admin_name: str,
    ) -> Dict[str, Any]:
        clean_reason = (reason or "").strip()
        if not clean_reason or len(clean_reason) < 5:
            raise ValueError("A clear, mandatory reason of at least 5 characters is required to blacklist a staff member.")

        success = self.repository.blacklist_staff(
            society_id=society_id,
            staff_id=staff_id,
            reason=clean_reason,
            admin_id=admin_id,
            admin_name=admin_name,
        )
        if not success:
            raise ValueError("Failed to blacklist staff member: Staff not found.")

        return self.repository.get_staff_by_id(society_id, staff_id)

    def unblacklist_staff(
        self,
        society_id: str,
        staff_id: str,
        reason: str,
        admin_id: str,
        admin_name: str,
    ) -> Dict[str, Any]:
        clean_reason = (reason or "").strip()
        if not clean_reason or len(clean_reason) < 5:
            raise ValueError("A mandatory reason of at least 5 characters is required to revoke blacklisting.")

        success = self.repository.unblacklist_staff(
            society_id=society_id,
            staff_id=staff_id,
            reason=clean_reason,
            admin_id=admin_id,
            admin_name=admin_name,
            new_status="Inactive",  # Safe default, admin can reactivate after reviewing KYC
        )
        if not success:
            raise ValueError("Failed to reinstate staff member: Staff not found.")

        return self.repository.get_staff_by_id(society_id, staff_id)

    def get_blacklist_audit_report(self, society_id: str) -> List[Dict[str, Any]]:
        return self.repository.get_blacklist_audit_logs(society_id)

    # ----------------------------------------------------
    # Gate Attendance & Access Timings Engine
    # ----------------------------------------------------
    def log_gate_entry(
        self,
        society_id: str,
        staff_id: str,
        entry_gate: str = "Main Gate",
        guard_id: Optional[str] = None,
        remarks: Optional[str] = None,
        override_timing: bool = False,
    ) -> Dict[str, Any]:
        # 1. Timing rule validation
        config = self.repository.get_staff_config(society_id)
        self._validate_access_timings(config, override_timing)

        # 2. Gate entry logging via repository
        return self.repository.log_gate_entry(
            society_id=society_id,
            staff_id=staff_id,
            entry_gate=entry_gate,
            guard_id=guard_id,
            remarks=remarks,
        )

    def _validate_access_timings(self, config: Dict[str, Any], override_timing: bool):
        if override_timing and config["allow_emergency_night_entry"]:
            return

        now = datetime.datetime.now().time()
        start_str = config.get("daily_entry_start_time", "06:00")
        cutoff_str = config.get("daily_entry_cutoff_time", "22:00")

        try:
            start_parts = [int(p) for p in start_str.split(":")[:2]]
            cutoff_parts = [int(p) for p in cutoff_str.split(":")[:2]]
            start_time = datetime.time(start_parts[0], start_parts[1])
            cutoff_time = datetime.time(cutoff_parts[0], cutoff_parts[1])

            # Normal daytime window e.g., 06:00 to 22:00
            if start_time < cutoff_time:
                if not (start_time <= now <= cutoff_time):
                    raise ValueError(
                        f"Entry Restricted: Society policy restricts domestic staff entry between {cutoff_str} and {start_str}."
                    )
            else:
                # Overnight inverted window
                if not (now >= start_time or now <= cutoff_time):
                    raise ValueError(
                        f"Entry Restricted: Outside permitted entry hours ({start_str} to {cutoff_str})."
                    )
        except (ValueError, TypeError, IndexError) as e:
            if "Entry Restricted" in str(e):
                raise
            # If timing parsing fails, allow check-in but log warning
            pass

    def log_gate_exit(
        self,
        society_id: str,
        staff_id: str,
        exit_gate: str = "Main Gate",
        guard_id: Optional[str] = None,
        remarks: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.repository.log_gate_exit(
            society_id=society_id,
            staff_id=staff_id,
            exit_gate=exit_gate,
            guard_id=guard_id,
            remarks=remarks,
        )

    def get_live_attendance_feed(self, society_id: str) -> List[Dict[str, Any]]:
        return self.repository.get_live_attendance_feed(society_id)

    def get_attendance_timesheet_report(
        self,
        society_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        role_category: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        return self.repository.get_daily_attendance_report(
            society_id=society_id,
            start_date=start_date,
            end_date=end_date,
            role_category=role_category,
        )

    # ----------------------------------------------------
    # CSV Export Helpers
    # ----------------------------------------------------
    def export_attendance_csv(
        self,
        society_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        role_category: Optional[str] = None,
    ) -> str:
        logs = self.repository.get_daily_attendance_report(
            society_id=society_id,
            start_date=start_date,
            end_date=end_date,
            role_category=role_category,
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Staff Name", "Role", "Phone", "Entry Gate", "Entry Time",
            "Exit Gate", "Exit Time", "Total Minutes", "Assigned Flats Visited", "Status", "Remarks"
        ])
        for row in logs:
            writer.writerow([
                row["staff_name"],
                row["role_category"],
                row["phone_number"],
                row["entry_gate"],
                row["entry_timestamp"],
                row["exit_gate"] or "N/A",
                row["exit_timestamp"] or "Still Inside",
                row["total_minutes_logged"],
                row["flats_visited"] or "None",
                row["status_label"],
                row["remarks"] or "",
            ])
        return output.getvalue()

    def export_blacklist_audit_csv(self, society_id: str) -> str:
        audits = self.repository.get_blacklist_audit_logs(society_id)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Action Timestamp", "Staff Name", "Role", "Phone",
            "Action Type", "Reason Given", "Admin Name", "Admin ID"
        ])
        for a in audits:
            writer.writerow([
                a["action_timestamp"],
                a["staff_name"],
                a["role_category"],
                a["phone_number"],
                a["action_type"],
                a["reason"],
                a["reported_by_admin_name"],
                a["reported_by_admin_id"],
            ])
        return output.getvalue()
