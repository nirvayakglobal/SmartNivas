"""
Authentication HTTP Controller for Smart Nivas
Presentation Layer (Single Responsibility Principle) handling HTTP request/response validation.
Zero raw SQL queries, zero business calculations. Calls AuthenticationAndBootstrapService.
Routes:
  POST /api/auth/login
  POST /api/auth/activate-society-admin
  GET  /api/auth/me
"""

from typing import Any, Dict, Optional
from flask import Blueprint, request, jsonify, g as flask_global_context

from backend_api.services.authentication_and_bootstrap_service import (
    AuthenticationAndBootstrapService,
)
from backend_api.repositories.society_topology_and_user_repository import (
    SocietyTopologyAndUserRepository,
)
from backend_api.middlewares.jwt_authentication_middleware import (
    require_jwt_authentication,
    AuthenticatedUserContext,
)


def create_authentication_blueprint(
    authentication_service: Optional[AuthenticationAndBootstrapService] = None,
) -> Blueprint:
    """
    Factory function creating the Flask Blueprint for authentication routes.
    Supports dependency injection for modularity and unit testability.
    """
    authentication_blueprint: Blueprint = Blueprint("authentication", __name__)

    # Default service instantiation if not injected
    if authentication_service is None:
        society_topology_repository = SocietyTopologyAndUserRepository()
        authentication_service = AuthenticationAndBootstrapService(
            society_topology_repository=society_topology_repository
        )

    @authentication_blueprint.route("/login", methods=["POST"])
    def handle_user_login():
        """
        Endpoint: POST /api/auth/login
        Body: { "phone_number": "...", "password": "...", "society_code": "..." (optional) }
        """
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "INVALID_JSON_BODY",
                        "message": "A valid JSON request body is required.",
                    }
                ),
                400,
            )

        phone_number: Optional[str] = request_payload.get("phone_number")
        plaintext_password: Optional[str] = request_payload.get("password")
        society_unique_code: Optional[str] = request_payload.get("society_code")

        if not phone_number or not plaintext_password:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "MISSING_REQUIRED_FIELDS",
                        "message": "Both 'phone_number' and 'password' are required.",
                    }
                ),
                400,
            )

        is_successful, response_message, response_data = (
            authentication_service.authenticate_user_credentials(
                phone_number=str(phone_number),
                plaintext_password=str(plaintext_password),
                society_unique_code=(
                    str(society_unique_code) if society_unique_code else None
                ),
            )
        )

        if not is_successful:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "AUTHENTICATION_FAILED",
                        "message": response_message,
                    }
                ),
                401,
            )

        return (
            jsonify(
                {
                    "success": True,
                    "message": response_message,
                    "data": response_data,
                }
            ),
            200,
        )

    @authentication_blueprint.route("/activate-society-admin", methods=["POST"])
    def handle_society_admin_activation():
        """
        Endpoint: POST /api/auth/activate-society-admin
        Body: { "token": "...", "new_password": "...", "full_name": "..." (optional) }
        """
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "INVALID_JSON_BODY",
                        "message": "A valid JSON request body is required.",
                    }
                ),
                400,
            )

        bootstrap_activation_token: Optional[str] = request_payload.get("token")
        new_plaintext_password: Optional[str] = request_payload.get("new_password")
        full_name: Optional[str] = request_payload.get("full_name")

        if not bootstrap_activation_token or not new_plaintext_password:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "MISSING_REQUIRED_FIELDS",
                        "message": "Both 'token' and 'new_password' are required for account activation.",
                    }
                ),
                400,
            )

        is_successful, response_message, response_data = (
            authentication_service.activate_society_admin_via_bootstrap_token(
                bootstrap_activation_token=str(bootstrap_activation_token),
                new_plaintext_password=str(new_plaintext_password),
                full_name=str(full_name) if full_name else None,
            )
        )

        if not is_successful:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "ACTIVATION_FAILED",
                        "message": response_message,
                    }
                ),
                400,
            )

        return (
            jsonify(
                {
                    "success": True,
                    "message": response_message,
                    "data": response_data,
                }
            ),
            200,
        )

    @authentication_blueprint.route("/me", methods=["GET"])
    @require_jwt_authentication
    def handle_get_current_authenticated_user():
        """
        Endpoint: GET /api/auth/me
        Returns current token subject claims.
        """
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        return (
            jsonify(
                {
                    "success": True,
                    "data": {
                        "user": authenticated_user.to_dictionary(),
                    },
                }
            ),
            200,
        )

    return authentication_blueprint
