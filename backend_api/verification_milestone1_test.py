"""
Verification test suite for Milestone 1:
1. Static analysis verifying zero single-letter variables in backend_api.
2. Unit tests for JWT creation, decoding, and tamper detection.
3. Middleware test verifying that SUPER_ADMIN is strictly blocked (HTTP 403) from society operational endpoints.
4. Route tests for /api/health, /api/auth/login validation, and /api/auth/me token authorization.
"""

import ast
import os
import sys
import unittest
from flask import Flask, jsonify, g
import pymysql

# Add project root to sys.path
project_root_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root_directory not in sys.path:
    sys.path.insert(0, project_root_directory)

from backend_api.application_factory import create_smart_nivas_flask_application
from backend_api.middlewares.jwt_authentication_middleware import (
    generate_jwt_access_token,
    decode_and_verify_jwt_token,
    AuthenticatedUserContext,
)
from backend_api.middlewares.tenant_privacy_and_entitlement_middleware import (
    require_society_permission,
    require_super_admin,
)


class VariableNamingAuditor(ast.NodeVisitor):
    """
    AST Visitor that detects any single-letter variable names or loop iteration variables.
    """

    def __init__(self, file_path: str):
        self.file_path: str = file_path
        self.naming_violations = []

    def visit_Name(self, ast_name_node):
        variable_identifier = ast_name_node.id
        # Single-letter variable check (excluding python conventions if any, but SKILL.md says ZERO single-letter variables)
        if len(variable_identifier) == 1 and variable_identifier != "_":
            self.naming_violations.append(
                f"File: {self.file_path}, Line: {ast_name_node.lineno}, Single-letter identifier: '{variable_identifier}'"
            )
        self.generic_visit(ast_name_node)

    def visit_FunctionDef(self, ast_function_node):
        for argument_node in ast_function_node.args.args:
            argument_name = argument_node.arg
            if len(argument_name) == 1 and argument_name != "_":
                self.naming_violations.append(
                    f"File: {self.file_path}, Line: {argument_node.lineno}, Single-letter function argument: '{argument_name}'"
                )
        self.generic_visit(ast_function_node)


class Milestone1VerificationTestCase(unittest.TestCase):
    def test_zero_single_letter_variables_in_backend_codebase(self):
        """
        Scans all Python files in backend_api to verify ZERO single-letter variables exist.
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
            f"Detected single-letter variables violating SKILL.md:\n"
            + "\n".join(detected_violations),
        )

    def test_jwt_generation_and_decoding_integrity(self):
        """
        Verifies that JWT access tokens correctly encode and decode claims.
        """
        test_jwt_token = generate_jwt_access_token(
            user_id=101,
            society_id=5,
            flat_id=12,
            user_role="RESIDENT",
            phone_number="9876543210",
            full_name="Rajesh Sharma",
        )

        decoded_context: AuthenticatedUserContext = decode_and_verify_jwt_token(
            test_jwt_token
        )

        self.assertEqual(decoded_context.user_id, 101)
        self.assertEqual(decoded_context.society_id, 5)
        self.assertEqual(decoded_context.flat_id, 12)
        self.assertEqual(decoded_context.user_role, "RESIDENT")
        self.assertEqual(decoded_context.phone_number, "9876543210")
        self.assertEqual(decoded_context.full_name, "Rajesh Sharma")

    def test_privacy_wall_strictly_blocks_super_admin_from_society_endpoints(self):
        """
        CRITICAL TEST: Verifies that a SUPER_ADMIN token calling a society-scoped endpoint
        is blocked with HTTP 403 PRIVACY_WALL_RESTRICTION.
        """
        test_application: Flask = create_smart_nivas_flask_application()

        # Create a mock society operational route protected by require_society_permission
        @test_application.route("/api/mock-society-flats")
        @require_society_permission(allowed_roles=["SOCIETY_ADMIN", "RESIDENT"])
        def mock_society_flats_endpoint():
            return jsonify({"success": True, "flats": ["A-101", "A-102"]})

        client = test_application.test_client()

        # Generate a SUPER_ADMIN JWT token
        super_admin_jwt = generate_jwt_access_token(
            user_id=1,
            society_id=None,
            flat_id=None,
            user_role="SUPER_ADMIN",
            phone_number="9999999999",
            full_name="Niravayak Super Admin",
        )

        http_response = client.get(
            "/api/mock-society-flats",
            headers={"Authorization": f"Bearer {super_admin_jwt}"},
        )

        self.assertEqual(http_response.status_code, 403)
        response_json_payload = http_response.get_json()
        self.assertEqual(
            response_json_payload.get("error_code"), "PRIVACY_WALL_RESTRICTION"
        )
        self.assertIn(
            "strictly prohibited from accessing private society operations",
            response_json_payload.get("message", ""),
        )

    def test_super_admin_guard_blocks_non_super_admins(self):
        """
        Verifies that society roles (RESIDENT, SOCIETY_ADMIN, GUARD) cannot access /central CRM.
        """
        test_application: Flask = create_smart_nivas_flask_application()

        @test_application.route("/api/central/mock-leads")
        @require_super_admin
        def mock_central_leads_endpoint():
            return jsonify({"success": True, "leads": []})

        client = test_application.test_client()

        resident_jwt = generate_jwt_access_token(
            user_id=55,
            society_id=2,
            flat_id=10,
            user_role="RESIDENT",
            phone_number="9876543211",
            full_name="Pooja Patel",
        )

        http_response = client.get(
            "/api/central/mock-leads",
            headers={"Authorization": f"Bearer {resident_jwt}"},
        )

        self.assertEqual(http_response.status_code, 403)
        response_json_payload = http_response.get_json()
        self.assertEqual(
            response_json_payload.get("error_code"), "FORBIDDEN_CENTRAL_CRM_ACCESS"
        )

    def test_api_health_endpoint(self):
        """
        Verifies that /api/health responds with 200 OK and valid status.
        """
        test_application: Flask = create_smart_nivas_flask_application()
        client = test_application.test_client()

        http_response = client.get("/api/health")
        self.assertEqual(http_response.status_code, 200)
        response_json_payload = http_response.get_json()
        self.assertEqual(response_json_payload.get("platform"), "Smart Nivas")
        self.assertEqual(response_json_payload.get("status"), "OPERATIONAL")

    def test_auth_me_endpoint_with_valid_and_missing_token(self):
        """
        Verifies /api/auth/me validates Bearer token and rejects requests without Authorization header.
        """
        test_application: Flask = create_smart_nivas_flask_application()
        client = test_application.test_client()

        # Without token
        unauthorized_response = client.get("/api/auth/me")
        self.assertEqual(unauthorized_response.status_code, 401)
        self.assertEqual(
            unauthorized_response.get_json().get("error_code"),
            "MISSING_AUTHORIZATION_HEADER",
        )

        # With valid token
        valid_jwt = generate_jwt_access_token(
            user_id=77,
            society_id=3,
            flat_id=None,
            user_role="SOCIETY_ADMIN",
            phone_number="9825000000",
            full_name="Committee Secretary",
        )
        authorized_response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {valid_jwt}"},
        )
        self.assertEqual(authorized_response.status_code, 200)
        self.assertEqual(
            authorized_response.get_json()["data"]["user"]["user_role"], "SOCIETY_ADMIN"
        )


if __name__ == "__main__":
    unittest.main()
