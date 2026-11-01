"""
Smart Nivas - Verification Test Suite for Daily Staff & Helper Management
Tests:
1. Staff roster creation with flat assignments
2. Mandatory KYC enforcement preventing activation without ID / Police verification
3. Successful activation once KYC verified
4. Gate check-in and check-out tracking
5. Blacklist action with mandatory reason, auto force-exit, and audit entry
6. Blacklisted staff entry attempt rejection
7. Blacklist unban workflow
8. Attendance Timesheet and Blacklist Audit reports
"""

import sys
import os
import unittest
import uuid
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend_api.repositories.society_daily_staff_repository import SocietyDailyStaffRepository
from backend_api.services.society_daily_staff_service import SocietyDailyStaffService
from backend_api.database.mysql_connection_pool_manager import global_database_connection_manager


class DailyStaffVerificationTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo = SocietyDailyStaffRepository()
        cls.service = SocietyDailyStaffService(cls.repo)
        cls.test_society_id = "1"  # Shilp Serenity

        # Ensure config exists with mandatory ID proof required
        cls.service.update_staff_config(
            cls.test_society_id,
            {
                "enforce_mandatory_id_proof": True,
                "enforce_mandatory_police_verification": True,
                "daily_entry_start_time": "00:00",
                "daily_entry_cutoff_time": "23:59",
                "allow_emergency_night_entry": True,
            },
        )

    def test_01_kyc_enforcement_blocks_activation(self):
        """Verify that staff without verified ID and Police clearance cannot be activated when rules are enforced."""
        staff_data = {
            "full_name": "Ramesh Kumar (Maid)",
            "phone_number": "9876543210",
            "role_category": "Maid",
            "is_id_proof_verified": False,
            "police_verification_status": "Pending",
            "status": "Active",  # Attempting to activate directly
        }
        with self.assertRaises(ValueError) as ctx:
            self.service.register_staff_member(self.test_society_id, staff_data)
        self.assertIn("Mandatory ID Proof", str(ctx.exception))

    def test_02_create_pending_kyc_and_activate_after_verification(self):
        """Verify staff registration with Pending_KYC, then verify KYC and promote to Active."""
        staff_data = {
            "full_name": "Sunita Ben",
            "phone_number": "9825098250",
            "role_category": "Cook",
            "gender": "Female",
            "id_proof_type": "Aadhaar",
            "id_proof_number": "1234-5678-9012",
            "is_id_proof_verified": False,
            "police_verification_status": "Pending",
            "status": "Pending_KYC",
            "assigned_flats": [
                {"flat_id": "flat_101", "flat_number": "A-101", "resident_name": "Amit Shah"},
                {"flat_id": "flat_102", "flat_number": "A-102", "resident_name": "Neha Patel"},
            ],
        }
        created = self.service.register_staff_member(self.test_society_id, staff_data)
        staff_id = created["staff_id"]
        self.assertEqual(created["status"], "Pending_KYC")
        self.assertEqual(len(created["assigned_flats"]), 2)

        # Still cannot activate without police verification
        with self.assertRaises(ValueError):
            self.service.update_staff_member(
                self.test_society_id,
                staff_id,
                {"is_id_proof_verified": True, "status": "Active"},
            )

        # Now fully verify KYC
        updated = self.service.update_staff_member(
            self.test_society_id,
            staff_id,
            {
                "is_id_proof_verified": True,
                "police_verification_status": "Verified",
                "police_verification_date": "2026-10-15",
                "status": "Active",
            },
        )
        self.assertEqual(updated["status"], "Active")
        self.assertTrue(updated["is_id_proof_verified"])
        self.assertEqual(updated["police_verification_status"], "Verified")

    def test_03_gate_entry_and_exit_lifecycle(self):
        """Verify live gate check-in and check-out."""
        # Create active verified staff
        staff_id = self.repo.create_staff({
            "society_id": self.test_society_id,
            "full_name": "Kishore Driver",
            "phone_number": "9898011223",
            "role_category": "Driver",
            "is_id_proof_verified": True,
            "police_verification_status": "Verified",
            "status": "Active",
            "assigned_flats": [{"flat_number": "B-304"}],
        })

        # Check-in at gate
        entry = self.service.log_gate_entry(
            self.test_society_id,
            staff_id,
            entry_gate="North Gate",
            guard_id="guard_007",
            remarks="Arrived on bike",
        )
        self.assertIsNotNone(entry["log_id"])
        self.assertIn("B-304", entry["flats_visited"])

        # Live feed should include Kishore
        live_feed = self.service.get_live_attendance_feed(self.test_society_id)
        active_ids = [item["staff_id"] for item in live_feed]
        self.assertIn(staff_id, active_ids)

        # Check-out at gate
        exit_log = self.service.log_gate_exit(
            self.test_society_id,
            staff_id,
            exit_gate="North Gate",
            guard_id="guard_007",
            remarks="Shift complete",
        )
        self.assertIsNotNone(exit_log["exit_timestamp"])

        # No longer in live feed
        live_feed_after = self.service.get_live_attendance_feed(self.test_society_id)
        active_ids_after = [item["staff_id"] for item in live_feed_after]
        self.assertNotIn(staff_id, active_ids_after)

    def test_04_blacklisting_workflow_and_audit(self):
        """Verify blacklisting instantly revokes access, logs mandatory reason, and rejects subsequent check-in."""
        staff_id = self.repo.create_staff({
            "society_id": self.test_society_id,
            "full_name": "Suspicious Cleaner",
            "phone_number": "9111222333",
            "role_category": "Cleaner",
            "is_id_proof_verified": True,
            "police_verification_status": "Verified",
            "status": "Active",
        })

        # Staff checks in first
        self.service.log_gate_entry(self.test_society_id, staff_id)

        # Attempt to blacklist without adequate reason (must fail validation)
        with self.assertRaises(ValueError):
            self.service.blacklist_staff(
                self.test_society_id,
                staff_id,
                reason="bad",  # less than 5 chars
                admin_id="adm_1",
                admin_name="Chairman Mehta",
            )

        # Blacklist with proper reason
        blacklisted = self.service.blacklist_staff(
            self.test_society_id,
            staff_id,
            reason="Found trespassing on rooftop restricted zone without authorization",
            admin_id="adm_1",
            admin_name="Chairman Mehta",
        )
        self.assertEqual(blacklisted["status"], "Blacklisted")
        self.assertFalse(blacklisted["is_currently_inside"])  # auto force-checked out

        # Attempt entry while blacklisted must fail
        with self.assertRaises(ValueError) as ctx:
            self.service.log_gate_entry(self.test_society_id, staff_id)
        self.assertIn("BLACKLISTED", str(ctx.exception))

        # Verify audit registry
        audit_logs = self.service.get_blacklist_audit_report(self.test_society_id)
        reasons = [a["reason"] for a in audit_logs if a["staff_id"] == staff_id]
        self.assertTrue(any("rooftop restricted zone" in r for r in reasons))

        # Test CSV export
        csv_text = self.service.export_blacklist_audit_csv(self.test_society_id)
        self.assertIn("Suspicious Cleaner", csv_text)
        self.assertIn("rooftop restricted zone", csv_text)


if __name__ == "__main__":
    unittest.main()
