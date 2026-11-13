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
    # TOPOLOGY (WINGS & FLATS) - READ ONLY FOR SOCIETY ADMIN
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
        return (
            jsonify(
                {
                    "success": False,
                    "error_code": "PROVISIONING_LOCKED",
                    "message": "Topology provisioning is managed centrally by Niravayak Global CRM. Society Admin cannot generate or alter building topology.",
                }
            ),
            403,
        )

    @society_admin_blueprint.route("/topology/flats", methods=["POST"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_create_single_flat():
        return (
            jsonify(
                {
                    "success": False,
                    "error_code": "PROVISIONING_LOCKED",
                    "message": "Topology provisioning is managed centrally by Niravayak Global CRM. Society Admin cannot add new flats.",
                }
            ),
            403,
        )

    @society_admin_blueprint.route("/topology/flats/<int:flat_id>", methods=["PATCH"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_update_flat(flat_id: int):
        return (
            jsonify(
                {
                    "success": False,
                    "error_code": "PROVISIONING_LOCKED",
                    "message": "Topology provisioning is managed centrally by Niravayak Global CRM. Society Admin cannot modify building topology.",
                }
            ),
            403,
        )

    @society_admin_blueprint.route("/topology/flats/<int:flat_id>", methods=["DELETE"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_delete_flat(flat_id: int):
        return (
            jsonify(
                {
                    "success": False,
                    "error_code": "PROVISIONING_LOCKED",
                    "message": "Topology provisioning is managed centrally by Niravayak Global CRM. Society Admin cannot delete flats.",
                }
            ),
            403,
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

    @society_admin_blueprint.route("/residents/<int:resident_user_id>", methods=["PATCH"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_update_resident(resident_user_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        full_name = str(request_payload.get("full_name", "")).strip()
        phone_number = str(request_payload.get("phone_number", "")).strip()
        wing_name = str(request_payload.get("wing_name", "")).strip()
        flat_number = str(request_payload.get("flat_number", "")).strip()
        resident_type = str(request_payload.get("resident_type", "OWNER")).upper()
        approval_status = str(
            request_payload.get("approval_status", "APPROVED")
        ).upper()

        try:
            is_successful, response_message = admin_service.update_resident(
                society_id=authenticated_user.society_id,  # type: ignore
                user_id=resident_user_id,
                full_name=full_name,
                phone_number=phone_number,
                wing_name=wing_name,
                flat_number=flat_number,
                resident_type=resident_type,
                approval_status=approval_status,
            )
            return (
                jsonify(
                    {
                        "success": is_successful,
                        "message": response_message,
                    }
                ),
                200,
            )
        except ValueError as validation_error:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "UPDATE_RESIDENT_ERROR",
                        "message": str(validation_error),
                    }
                ),
                400,
            )

    @society_admin_blueprint.route("/residents/<int:resident_user_id>/approval", methods=["PATCH"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_update_resident_approval(resident_user_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload or "approval_status" not in request_payload:
            return (
                jsonify({"success": False, "message": "'approval_status' field is required."}),
                400,
            )

        approval_status = str(request_payload["approval_status"]).upper()
        try:
            is_successful, response_message = admin_service.update_resident_approval_status(
                society_id=authenticated_user.society_id,  # type: ignore
                user_id=resident_user_id,
                approval_status=approval_status,
            )
            return (
                jsonify({"success": is_successful, "message": response_message}),
                200,
            )
        except ValueError as validation_error:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "APPROVAL_STATUS_ERROR",
                        "message": str(validation_error),
                    }
                ),
                400,
            )

    @society_admin_blueprint.route("/residents/<int:resident_user_id>", methods=["DELETE"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_delete_resident(resident_user_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        try:
            is_successful, response_message = admin_service.delete_resident(
                society_id=authenticated_user.society_id,  # type: ignore
                user_id=resident_user_id,
            )
            return (
                jsonify(
                    {
                        "success": is_successful,
                        "message": response_message,
                    }
                ),
                200,
            )
        except ValueError as validation_error:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "DELETE_RESIDENT_ERROR",
                        "message": str(validation_error),
                    }
                ),
                400,
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

    @society_admin_blueprint.route("/guards/<int:guard_user_id>/status", methods=["PATCH"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_toggle_guard_status(guard_user_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload or "is_active" not in request_payload:
            return jsonify({"success": False, "message": "'is_active' boolean field is required."}), 400

        is_active = bool(request_payload["is_active"])
        is_successful, response_message = admin_service.toggle_guard_active_status(
            society_id=authenticated_user.society_id,  # type: ignore
            guard_user_id=guard_user_id,
            is_active=is_active,
        )
        return jsonify({"success": is_successful, "message": response_message}), 200

    @society_admin_blueprint.route("/guards/<int:guard_user_id>", methods=["PUT"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_update_guard(guard_user_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        full_name = str(request_payload.get("full_name", "")).strip()
        phone_number = str(request_payload.get("phone_number", "")).strip()
        pin = request_payload.get("pin")

        if not full_name or not phone_number:
            return jsonify({"success": False, "message": "'full_name' and 'phone_number' are required."}), 400

        is_successful, response_message = admin_service.update_security_guard(
            society_id=authenticated_user.society_id,  # type: ignore
            guard_user_id=guard_user_id,
            full_name=full_name,
            phone_number=phone_number,
            four_digit_pin=str(pin) if pin else None,
        )
        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 400

        return jsonify({"success": True, "message": response_message}), 200

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

    # -------------------------------------------------------------------------
    # DASHBOARD & COMMAND CENTER METRICS
    # -------------------------------------------------------------------------

    @society_admin_blueprint.route("/dashboard/metrics", methods=["GET"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_get_dashboard_metrics():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        dashboard_metrics = admin_service.retrieve_society_dashboard_metrics(
            society_id=authenticated_user.society_id  # type: ignore
        )
        return jsonify({"success": True, "data": dashboard_metrics}), 200

    # -------------------------------------------------------------------------
    # VISITOR CHECKOUT & RESIDENT SINGLE CREATION
    # -------------------------------------------------------------------------

    @society_admin_blueprint.route("/visitor-logs/<int:visit_log_id>/checkout", methods=["POST"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_checkout_visitor(visit_log_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        is_successful, response_message = admin_service.checkout_visitor(
            society_id=authenticated_user.society_id,  # type: ignore
            visit_log_id=visit_log_id,
        )
        return jsonify({"success": is_successful, "message": response_message}), 200

    @society_admin_blueprint.route("/residents", methods=["POST"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_create_single_resident():
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        full_name = str(request_payload.get("full_name", "")).strip()
        phone_number = str(request_payload.get("phone_number", "")).strip()
        wing_name = str(request_payload.get("wing_name", "")).strip()
        flat_number = str(request_payload.get("flat_number", "")).strip()
        resident_type = str(request_payload.get("resident_type", "OWNER")).upper()
        approval_status = str(request_payload.get("approval_status", "APPROVED")).upper()
        documents = request_payload.get("documents", [])

        is_successful, response_message, new_resident_id = (
            admin_service.create_single_resident(
                society_id=authenticated_user.society_id,  # type: ignore
                wing_name=wing_name,
                flat_number=flat_number,
                full_name=full_name,
                phone_number=phone_number,
                resident_type=resident_type,
                approval_status=approval_status,
                documents=documents,
            )
        )
        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 400

        return (
            jsonify(
                {
                    "success": True,
                    "message": response_message,
                    "data": {"user_id": new_resident_id},
                }
            ),
            201,
        )

    # -------------------------------------------------------------------------
    # RESIDENT VERIFICATION DOCUMENTS MANAGEMENT
    # -------------------------------------------------------------------------

    @society_admin_blueprint.route("/residents/<int:resident_user_id>/documents", methods=["GET"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_get_resident_documents(resident_user_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        try:
            documents_list = admin_service.retrieve_resident_documents(
                society_id=authenticated_user.society_id,  # type: ignore
                user_id=resident_user_id,
            )
            return jsonify({"success": True, "data": documents_list}), 200
        except ValueError as retrieval_error:
            return jsonify({"success": False, "message": str(retrieval_error)}), 404

    @society_admin_blueprint.route("/residents/<int:resident_user_id>/documents", methods=["POST"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_upload_resident_document(resident_user_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        document_type = str(request_payload.get("document_type", "OTHER")).upper()
        document_title = str(request_payload.get("document_title", "")).strip()
        file_name = str(request_payload.get("file_name", "document.pdf")).strip()
        file_path_or_url = str(request_payload.get("file_path_or_url", "")).strip()
        file_size_bytes = request_payload.get("file_size_bytes")

        if not file_path_or_url:
            return jsonify({"success": False, "message": "'file_path_or_url' is required."}), 400

        try:
            is_successful, response_message, new_doc_id = (
                admin_service.attach_document_to_resident(
                    society_id=authenticated_user.society_id,  # type: ignore
                    user_id=resident_user_id,
                    document_type=document_type,
                    document_title=document_title,
                    file_name=file_name,
                    file_path_or_url=file_path_or_url,
                    file_size_bytes=int(file_size_bytes) if file_size_bytes else None,
                    uploaded_by_user_id=authenticated_user.user_id,
                )
            )
            return (
                jsonify(
                    {
                        "success": True,
                        "message": response_message,
                        "data": {"document_id": new_doc_id},
                    }
                ),
                201,
            )
        except ValueError as validation_error:
            return jsonify({"success": False, "message": str(validation_error)}), 400

    @society_admin_blueprint.route("/residents/documents/<int:document_id>", methods=["DELETE"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_delete_resident_document(document_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        is_successful, response_message = admin_service.remove_resident_document(
            society_id=authenticated_user.society_id,  # type: ignore
            document_id=document_id,
        )
        return jsonify({"success": is_successful, "message": response_message}), 200

    # -------------------------------------------------------------------------
    # FLAT OWNERSHIP TRANSFER & HISTORICAL AUDIT
    # -------------------------------------------------------------------------

    @society_admin_blueprint.route("/flats/<int:flat_id>/ownership-transfer", methods=["POST"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_transfer_flat_ownership(flat_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        new_owner_name = str(request_payload.get("new_owner_name", "")).strip()
        new_owner_phone = str(request_payload.get("new_owner_phone", "")).strip()
        transfer_sale_date = str(request_payload.get("transfer_sale_date", "")).strip()
        sale_deed_document_url = request_payload.get("sale_deed_document_url")
        sale_deed_document_filename = request_payload.get("sale_deed_document_filename")
        transfer_remarks = request_payload.get("transfer_remarks")
        transfer_fee_inr = float(request_payload.get("transfer_fee_inr") or 0.0)
        fee_category = str(request_payload.get("fee_category", "SOCIETY_TRANSFER_FEE"))
        society_development_fund_inr = float(request_payload.get("society_development_fund_inr") or 0.0)
        payment_mode = str(request_payload.get("payment_mode", "NEFT_RTGS"))
        payment_reference_number = request_payload.get("payment_reference_number")
        deactivate_previous_owner = bool(request_payload.get("deactivate_previous_owner", True))

        if not new_owner_name or not new_owner_phone or not transfer_sale_date:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "New owner name, phone number, and sale/transfer date are required.",
                    }
                ),
                400,
            )

        is_successful, response_message, new_owner_id = (
            admin_service.transfer_flat_ownership(
                society_id=authenticated_user.society_id,  # type: ignore
                flat_id=flat_id,
                admin_user_id=authenticated_user.user_id,  # type: ignore
                new_owner_name=new_owner_name,
                new_owner_phone=new_owner_phone,
                transfer_sale_date=transfer_sale_date,
                sale_deed_document_url=sale_deed_document_url,
                sale_deed_document_filename=sale_deed_document_filename,
                transfer_remarks=transfer_remarks,
                transfer_fee_inr=transfer_fee_inr,
                fee_category=fee_category,
                society_development_fund_inr=society_development_fund_inr,
                payment_mode=payment_mode,
                payment_reference_number=payment_reference_number,
                deactivate_previous_owner=deactivate_previous_owner,
            )
        )
        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 400

        return (
            jsonify(
                {
                    "success": True,
                    "message": response_message,
                    "data": {"new_owner_user_id": new_owner_id},
                }
            ),
            201,
        )

    @society_admin_blueprint.route("/flats/<int:flat_id>/ownership-history", methods=["GET"])
    @require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    def handle_get_flat_ownership_history(flat_id: int):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        ownership_history_records = admin_service.retrieve_flat_ownership_history(
            society_id=authenticated_user.society_id,  # type: ignore
            flat_id=flat_id,
        )
        return jsonify({"success": True, "data": ownership_history_records}), 200

    return society_admin_blueprint
