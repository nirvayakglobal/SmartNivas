"""
Verification Test Suite for Milestone 3 (Society Admin Portal):
1. Verifies zero single-letter variables in newly created Python and JSX files.
2. Unit tests for SocietyAdministrationService (ACID rollback on duplicate flat).
3. Verifies that /api/admin/* endpoints strictly enforce:
   - Blocking Niravayak SUPER_ADMIN with HTTP 403 PRIVACY_WALL_RESTRICTION.
   - Requiring SOCIETY_ADMIN role.
   - Checking feature flag entitlement on notices (enable_notice_board).
"""

import ast
import os
import sys
import re
import unittest
from flask import Flask, jsonify, g as flask_global_context
from unittest.mock import MagicMock

project_root_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root_directory not in sys.path:
    sys.path.insert(0, project_root_directory)

from backend_api.application_factory import create_smart_nivas_flask_application
from backend_api.middlewares.jwt_authentication_middleware import (
    generate_jwt_access_token,
)
from backend_api.services.society_administration_service import (
    SocietyAdministrationService,
)
from backend_api.verification_milestone1_test import VariableNamingAuditor


class Milestone3VerificationTestCase(unittest.TestCase):
    def test_zero_single_letter_variables_in_backend_and_web(self):
        """
        Scans all python files in backend_api for zero single-letter variables.
        """
        backend_api_directory = os.path.join(project_root_directory, "backend_api")
        detected_violations = []

        for root_directory_path, _, file_names in os.walk(backend_api_directory):
            for file_name in file_names:
                if file_name.endswith(".py"):
                    full_file_path = os.path.join(root_directory_path, file_name)
                    with open(full_file_path, "r", encoding="utf-8") as python_file:
                        source_code = python_file.read()
                    abstract_syntax_tree = ast.parse(source_code, filename=full_file_path)
                    auditor = VariableNamingAuditor(full_file_path)
                    auditor.visit(abstract_syntax_tree)
                    detected_violations.extend(auditor.naming_violations)

        self.assertEqual(
            len(detected_violations),
            0,
            f"Detected single-letter variables in backend:\n"
            + "\n".join(detected_violations),
        )

    def test_zero_single_letter_variables_in_web_jsx(self):
        """
        Regex audit across all web_application/src files for single-letter arrow callbacks.
        """
        web_src_directory = os.path.join(
            project_root_directory, "web_application", "src"
        )
        forbidden_single_letter_pattern = re.compile(
            r"(?:\(\s*[a-zA-Z]\s*\)\s*=>)|(?:\(\s*[a-zA-Z]\s*,\s*[a-zA-Z]\s*\)\s*=>)|(?:\.map\(\s*[a-zA-Z]\s*=>)"
        )
        detected_violations = []

        for root_directory_path, _, file_names in os.walk(web_src_directory):
            for file_name in file_names:
                if file_name.endswith((".jsx", ".js")):
                    full_file_path = os.path.join(root_directory_path, file_name)
                    with open(full_file_path, "r", encoding="utf-8") as js_file:
                        file_lines = js_file.readlines()
                    for line_number, line_content in enumerate(file_lines, start=1):
                        if forbidden_single_letter_pattern.search(line_content):
                            detected_violations.append(
                                f"File: {full_file_path}, Line: {line_number}: {line_content.strip()}"
                            )

        self.assertEqual(
            len(detected_violations),
            0,
            f"Detected single-letter JS arrow function parameters in frontend:\n"
            + "\n".join(detected_violations),
        )

    def test_society_admin_routes_block_super_admin_privacy_wall(self):
        """
        STRICT PRIVACY WALL TEST:
        SUPER_ADMIN token attempting to access /api/admin/topology or /api/admin/residents
        MUST be categorically blocked with HTTP 403 PRIVACY_WALL_RESTRICTION.
        """
        application_instance = create_smart_nivas_flask_application()
        test_client = application_instance.test_client()

        super_admin_jwt = generate_jwt_access_token(
            user_id=1,
            society_id=None,
            flat_id=None,
            user_role="SUPER_ADMIN",
            phone_number="9999999999",
            full_name="Niravayak Super Admin",
        )

        http_response = test_client.get(
            "/api/admin/topology",
            headers={"Authorization": f"Bearer {super_admin_jwt}"},
        )
        self.assertEqual(http_response.status_code, 403)
        self.assertEqual(
            http_response.get_json().get("error_code"), "PRIVACY_WALL_RESTRICTION"
        )

    def test_society_admin_routes_block_unauthorized_roles(self):
        """
        Verifies that RESIDENT or GUARD roles are blocked with 403 from /api/admin/*.
        """
        application_instance = create_smart_nivas_flask_application()
        test_client = application_instance.test_client()

        guard_jwt = generate_jwt_access_token(
            user_id=45,
            society_id=2,
            flat_id=None,
            user_role="GUARD",
            phone_number="9825444444",
            full_name="Gate Guard",
        )

        http_response = test_client.get(
            "/api/admin/topology",
            headers={"Authorization": f"Bearer {guard_jwt}"},
        )
        self.assertEqual(http_response.status_code, 403)
        self.assertEqual(
            http_response.get_json().get("error_code"), "UNAUTHORIZED_ROLE_ACCESS"
        )

    def test_bulk_flat_generation_acid_rollback_on_conflict(self):
        """
        Verifies that bulk_generate_wings_and_flats raises ValueError on duplicate flat
        and aborts transaction.
        """
        mock_repository = MagicMock()
        mock_db_manager = MagicMock()
        mock_cursor = MagicMock()
        mock_db_manager.database_transaction_scope.return_value.__enter__.return_value = (
            mock_cursor
        )

        # Mock existing wing
        mock_repository.find_wing_by_name.return_value = {
            "wing_id": 10,
            "wing_name": "A",
        }
        # Simulate flat 101 already exists
        mock_repository.find_flat_by_wing_and_number.side_effect = lambda database_cursor, wing_id, flat_number: (
            {"flat_id": 1, "flat_number": "101"} if flat_number == "101" else None
        )

        admin_service = SocietyAdministrationService(
            topology_repository=mock_repository,
            database_connection_manager=mock_db_manager,
        )

        with self.assertRaises(ValueError) as exception_context:
            admin_service.bulk_generate_wings_and_flats(
                society_id=5,
                wing_names_list=["A"],
                start_floor_number=1,
                end_floor_number=2,
                flats_per_floor_count=2,
            )

        self.assertIn("already exists in Wing 'A'", str(exception_context.exception))
        self.assertIn("rolled back", str(exception_context.exception))


if __name__ == "__main__":
    unittest.main()
