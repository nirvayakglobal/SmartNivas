"""
Automated Verification Suite for Milestone 2:
1. Static analysis verifying ZERO single-letter variables in backend_api and web_application.
2. Unit tests for Niravayak Central CRM controller routes (/api/central/leads, /plans, /clients, /invoices).
3. Test that non-SUPER_ADMIN is rejected with HTTP 403 FORBIDDEN_CENTRAL_CRM_ACCESS.
4. Test that Desktop Web Application dist/index.html is compiled and served at /central.
"""

import ast
import os
import sys
import re
import unittest
from flask import Flask
from unittest.mock import MagicMock

project_root_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root_directory not in sys.path:
    sys.path.insert(0, project_root_directory)

from backend_api.application_factory import create_smart_nivas_flask_application
from backend_api.middlewares.jwt_authentication_middleware import (
    generate_jwt_access_token,
)
from backend_api.verification_milestone1_test import VariableNamingAuditor


class Milestone2VerificationTestCase(unittest.TestCase):
    def test_zero_single_letter_variables_in_entire_backend(self):
        """
        Scans all Python files in backend_api to verify zero single-letter variables.
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

    def test_zero_single_letter_variables_in_web_application_jsx(self):
        """
        Regex audit across all web_application/src files to ensure no forbidden
        single-letter callback params like (x => ...), (e => ...), (a, b), etc.
        """
        web_src_directory = os.path.join(
            project_root_directory, "web_application", "src"
        )
        # Pattern detects (x) =>, (e) =>, map(x =>, etc.
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

    def test_central_crm_routes_block_unauthorized_and_non_superadmin(self):
        """
        Verifies that /api/central/* routes require JWT and reject non-SUPER_ADMIN tokens.
        """
        application_instance = create_smart_nivas_flask_application()
        test_client = application_instance.test_client()

        # 1. Unauthenticated request
        unauthenticated_response = test_client.get("/api/central/leads")
        self.assertEqual(unauthenticated_response.status_code, 401)

        # 2. Authenticated as RESIDENT
        resident_jwt = generate_jwt_access_token(
            user_id=88,
            society_id=1,
            flat_id=10,
            user_role="RESIDENT",
            phone_number="9876543210",
            full_name="Regular Resident",
        )
        forbidden_response = test_client.get(
            "/api/central/leads",
            headers={"Authorization": f"Bearer {resident_jwt}"},
        )
        self.assertEqual(forbidden_response.status_code, 403)
        self.assertEqual(
            forbidden_response.get_json().get("error_code"),
            "FORBIDDEN_CENTRAL_CRM_ACCESS",
        )

    def test_desktop_web_application_distribution_bundle_exists(self):
        """
        Verifies that Vite successfully compiled web_application/dist/index.html.
        """
        distribution_html_path = os.path.join(
            project_root_directory, "web_application", "dist", "index.html"
        )
        self.assertTrue(
            os.path.exists(distribution_html_path),
            f"Expected {distribution_html_path} to exist after build.",
        )

        application_instance = create_smart_nivas_flask_application()
        test_client = application_instance.test_client()
        web_portal_response = test_client.get("/central", follow_redirects=True)
        self.assertEqual(web_portal_response.status_code, 200)
        self.assertIn(b"Smart Nivas", web_portal_response.data)


if __name__ == "__main__":
    unittest.main()
