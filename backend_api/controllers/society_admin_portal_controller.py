"""
Society Admin Portal Controller for Smart Nivas
Presentation Layer (Single Responsibility Principle) handling HTTP endpoints for Society Managing Committees:
- GET, POST /api/admin/topology (bulk generate wings and flats)
- GET, POST /api/admin/residents (directory and CSV bulk import)
- GET, POST /api/admin/gates (gate setup and guard PIN creation)
- GET       /api/admin/visitor-logs (society visitor audit register)
- GET, POST /api/admin/notices (digital notice board, feature-flag checked)

All routes are strictly protected by @require_society_permission(allowed_roles=['SOCIETY_ADMIN']).
"""

from typing import Any, Dict, Optional
from flask import Blueprint, request, jsonify, g as flask_global_context

from backend_api.middlewares.tenant_privacy_and_entitlement_middleware import (
    require_society_permission,
)
from backend_api.middlewares.jwt_authentication_middleware import (
    AuthenticatedUserContext,
)
from backend_api.services.society_administration_service import (
    SocietyAdministrationService,
)
from backend_api.repositories.society_topology_and_user_repository import (
    SocietyTopologyAndUserRepository,
)


def create_society_admin_portal_blueprint(
    admin_service: Optional[SocietyAdministrationService] = None,
) -> Blueprint:
    """
    Factory creating the Flask Blueprint for Society Admin Portal.
    """
    society_admin_blueprint: Blueprint = Blueprint("society_admin_portal", __name__)

    if admin_service is None:
        topology_repository = SocietyTopologyAndUserRepository()
        admin_service = SocietyAdministrationService(
            topology_repository=topology_repository
        )

    # -------------------------------------------------------------------------
    # TOPOLOGY (WINGS & FLATS)
    # -------------------------------------------------------------------------

    @society_admin_blueprint.route("/topology", methods=["GET"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_get_topology():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        topology_data = admin_service.retrieve_society_topology(
            society_id=authenticated_user.society_id  # type: ignore
        )
        return jsonify({"success": True, "data": topology_data}), 200

    @society_admin_blueprint.route("/topology/bulk-generate", methods=["POST"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_bulk_generate_flats():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        wing_names_list = request_payload.get("wing_names", [])
        start_floor_number = int(request_payload.get("start_floor_number", 1))
        end_floor_number = int(request_payload.get("end_floor_number", 10))
        flats_per_floor_count = int(request_payload.get("flats_per_floor_count", 4))
        numbering_pattern = str(
            request_payload.get("numbering_pattern", "FLOOR_PREFIX")
        )

        try:
            is_successful, response_message, summary_data = (
                admin_service.bulk_generate_wings_and_flats(
                    society_id=authenticated_user.society_id,  # type: ignore
                    wing_names_list=wing_names_list,
                    start_floor_number=start_floor_number,
                    end_floor_number=end_floor_number,
                    flats_per_floor_count=flats_per_floor_count,
                    numbering_pattern=numbering_pattern,
                )
            )
        except ValueError as validation_error:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "DUPLICATE_OR_INVALID_TOPOLOGY",
                        "message": str(validation_error),
                    }
                ),
                409,
            )

        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 400

        return (
            jsonify(
                {
                    "success": True,
                    "message": response_message,
                    "data": summary_data,
                }
            ),
            201,
        )

    # -------------------------------------------------------------------------
    # RESIDENTS DIRECTORY & CSV IMPORT
    # -------------------------------------------------------------------------

    @society_admin_blueprint.route("/residents", methods=["GET"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_get_residents():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        residents_list = admin_service.retrieve_society_residents(
            society_id=authenticated_user.society_id  # type: ignore
        )
        return jsonify({"success": True, "data": residents_list}), 200

    @society_admin_blueprint.route("/residents/import-csv", methods=["POST"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_import_residents_csv():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload or "csv_content" not in request_payload:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "'csv_content' string is required.",
                    }
                ),
                400,
            )

        csv_content: str = str(request_payload["csv_content"])
        try:
            is_successful, response_message, import_summary = (
                admin_service.import_residents_from_csv(
                    society_id=authenticated_user.society_id,  # type: ignore
                    csv_file_content_string=csv_content,
                )
            )
        except ValueError as csv_parsing_error:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "CSV_IMPORT_ERROR",
                        "message": str(csv_parsing_error),
                    }
                ),
                400,
            )

        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 400

        return (
            jsonify(
                {
                    "success": True,
                    "message": response_message,
                    "data": import_summary,
                }
            ),
            200,
        )

    # -------------------------------------------------------------------------
    # GATES & GUARDS SETUP
    # -------------------------------------------------------------------------

    @society_admin_blueprint.route("/gates", methods=["GET"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_get_gates_and_guards():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        gates_and_guards_data = admin_service.retrieve_society_gates_and_guards(
            society_id=authenticated_user.society_id  # type: ignore
        )
        return jsonify({"success": True, "data": gates_and_guards_data}), 200

    @society_admin_blueprint.route("/gates", methods=["POST"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_create_gate():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload or not request_payload.get("gate_name"):
            return (
                jsonify(
                    {"success": False, "message": "'gate_name' is required."}
                ),
                400,
            )

        is_successful, response_message, new_gate_id = (
            admin_service.setup_new_society_gate(
                society_id=authenticated_user.society_id,  # type: ignore
                gate_name=str(request_payload["gate_name"]),
            )
        )

        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 403

        return (
            jsonify(
                {
                    "success": True,
                    "message": response_message,
                    "data": {"gate_id": new_gate_id},
                }
            ),
            201,
        )

    @society_admin_blueprint.route("/guards", methods=["POST"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_create_guard():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        full_name = request_payload.get("full_name")
        phone_number = request_payload.get("phone_number")
        four_digit_pin = request_payload.get("pin")

        if not full_name or not phone_number or not four_digit_pin:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "'full_name', 'phone_number', and 'pin' are required.",
                    }
                ),
                400,
            )

        is_successful, response_message, new_guard_user_id = (
            admin_service.setup_new_security_guard(
                society_id=authenticated_user.society_id,  # type: ignore
                full_name=str(full_name),
                phone_number=str(phone_number),
                four_digit_pin=str(four_digit_pin),
            )
        )

        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 400

        return (
            jsonify(
                {
                    "success": True,
                    "message": response_message,
                    "data": {"user_id": new_guard_user_id},
                }
            ),
            201,
        )

    # -------------------------------------------------------------------------
    # VISITOR AUDIT REGISTER
    # -------------------------------------------------------------------------

    @society_admin_blueprint.route("/visitor-logs", methods=["GET"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_get_visitor_logs():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        visitor_logs_list = admin_service.retrieve_society_visitor_logs(
            society_id=authenticated_user.society_id  # type: ignore
        )
        return jsonify({"success": True, "data": visitor_logs_list}), 200

    # -------------------------------------------------------------------------
    # DIGITAL NOTICE BOARD (FEATURE-FLAG PROTECTED)
    # -------------------------------------------------------------------------

    @society_admin_blueprint.route("/notices", methods=["GET"])
    @require_society_permission(
        allowed_roles=["SOCIETY_ADMIN"], required_feature_flag="enable_notice_board"
    )
    def handle_get_notices():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        notices_list = admin_service.retrieve_society_notices(
            society_id=authenticated_user.society_id  # type: ignore
        )
        return jsonify({"success": True, "data": notices_list}), 200

    @society_admin_blueprint.route("/notices", methods=["POST"])
    @require_society_permission(
        allowed_roles=["SOCIETY_ADMIN"], required_feature_flag="enable_notice_board"
    )
    def handle_publish_notice():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        notice_title = request_payload.get("notice_title")
        notice_body_content = request_payload.get("notice_body_content")

        if not notice_title or not notice_body_content:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "'notice_title' and 'notice_body_content' are required.",
                    }
                ),
                400,
            )

        is_successful, response_message, new_notice_id = (
            admin_service.publish_society_notice(
                society_id=authenticated_user.society_id,  # type: ignore
                admin_user_id=authenticated_user.user_id,
                notice_title=str(notice_title),
                notice_body_content=str(notice_body_content),
            )
        )

        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 400

        return (
            jsonify(
                {
                    "success": True,
                    "message": response_message,
                    "data": {"notice_id": new_notice_id},
                }
            ),
            201,
        )

    return society_admin_blueprint
