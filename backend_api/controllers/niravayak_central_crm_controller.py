"""
Niravayak Central CRM Controller for Smart Nivas
Presentation Layer (Single Responsibility Principle) handling HTTP endpoints for Super Admin:
- /api/central/leads
- /api/central/plans
- /api/central/clients
- /api/central/invoices

Protected strictly by @require_super_admin. Zero SQL queries inside controller.
"""

from typing import Any, Dict, List, Optional
from flask import Blueprint, request, jsonify

from backend_api.middlewares.tenant_privacy_and_entitlement_middleware import (
    require_super_admin,
)
from backend_api.services.niravayak_client_onboarding_service import (
    NiravayakClientOnboardingService,
)
from backend_api.repositories.niravayak_crm_and_licensing_repository import (
    NiravayakCrmAndLicensingRepository,
)


def create_niravayak_central_crm_blueprint(
    onboarding_service: Optional[NiravayakClientOnboardingService] = None,
) -> Blueprint:
    """
    Factory creating the Flask Blueprint for Niravayak Central CRM.
    Supports dependency injection for testing.
    """
    central_crm_blueprint: Blueprint = Blueprint("niravayak_central_crm", __name__)

    if onboarding_service is None:
        crm_repository = NiravayakCrmAndLicensingRepository()
        onboarding_service = NiravayakClientOnboardingService(
            crm_repository=crm_repository
        )

    # -------------------------------------------------------------------------
    # LEADS ENDPOINTS (/api/central/leads)
    # -------------------------------------------------------------------------

    @central_crm_blueprint.route("/leads", methods=["GET"])
    @require_super_admin
    def handle_get_all_crm_leads():
        leads_list = onboarding_service.retrieve_all_pipeline_leads()
        return jsonify({"success": True, "data": leads_list}), 200

    @central_crm_blueprint.route("/leads", methods=["POST"])
    @require_super_admin
    def handle_create_crm_lead():
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "INVALID_JSON_BODY",
                        "message": "A valid JSON payload is required.",
                    }
                ),
                400,
            )

        prospective_society_name: Optional[str] = request_payload.get(
            "prospective_society_name"
        )
        city_name: Optional[str] = request_payload.get("city_name", "Ahmedabad")
        contact_person_name: Optional[str] = request_payload.get("contact_person_name")
        contact_phone_number: Optional[str] = request_payload.get(
            "contact_phone_number"
        )
        contact_email_address: Optional[str] = request_payload.get(
            "contact_email_address"
        )
        follow_up_notes: Optional[str] = request_payload.get("follow_up_notes")

        if not prospective_society_name or not contact_person_name or not contact_phone_number:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "MISSING_REQUIRED_FIELDS",
                        "message": "'prospective_society_name', 'contact_person_name', and 'contact_phone_number' are required.",
                    }
                ),
                400,
            )

        is_successful, response_message, new_lead_id = (
            onboarding_service.capture_new_crm_lead(
                prospective_society_name=str(prospective_society_name),
                city_name=str(city_name),
                contact_person_name=str(contact_person_name),
                contact_phone_number=str(contact_phone_number),
                contact_email_address=(
                    str(contact_email_address) if contact_email_address else None
                ),
                follow_up_notes=str(follow_up_notes) if follow_up_notes else None,
            )
        )

        if not is_successful:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "CREATE_LEAD_FAILED",
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
                    "data": {"lead_id": new_lead_id},
                }
            ),
            201,
        )

    @central_crm_blueprint.route("/leads/<int:lead_id>/stage", methods=["PATCH"])
    @require_super_admin
    def handle_update_lead_stage(lead_id: int):
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload or "pipeline_stage" not in request_payload:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "MISSING_PIPELINE_STAGE",
                        "message": "'pipeline_stage' is required.",
                    }
                ),
                400,
            )

        pipeline_stage: str = str(request_payload["pipeline_stage"])
        follow_up_notes: Optional[str] = request_payload.get("follow_up_notes")

        is_successful, response_message = onboarding_service.update_lead_pipeline_stage(
            lead_id=lead_id,
            pipeline_stage=pipeline_stage,
            follow_up_notes=str(follow_up_notes) if follow_up_notes else None,
        )

        if not is_successful:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "UPDATE_STAGE_FAILED",
                        "message": response_message,
                    }
                ),
                400,
            )

        return jsonify({"success": True, "message": response_message}), 200

    # -------------------------------------------------------------------------
    # PLANS ENDPOINTS (/api/central/plans)
    # -------------------------------------------------------------------------

    @central_crm_blueprint.route("/plans", methods=["GET"])
    @require_super_admin
    def handle_get_all_plans():
        subscription_plans = onboarding_service.retrieve_all_plans()
        return jsonify({"success": True, "data": subscription_plans}), 200

    @central_crm_blueprint.route("/plans", methods=["POST"])
    @require_super_admin
    def handle_create_plan():
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        is_successful, response_message, new_plan_id = (
            onboarding_service.create_new_subscription_plan(
                plan_name=str(request_payload.get("plan_name", "Custom Plan")),
                billing_cycle=str(request_payload.get("billing_cycle", "YEARLY")),
                base_price_inr=float(request_payload.get("base_price_inr", 0.0)),
                max_gates_allowed=int(request_payload.get("max_gates_allowed", 2)),
                photo_retention_days=int(request_payload.get("photo_retention_days", 45)),
                enable_walkin_approval=bool(
                    request_payload.get("enable_walkin_approval", True)
                ),
                enable_preapproval_passcode=bool(
                    request_payload.get("enable_preapproval_passcode", True)
                ),
                enable_visitor_photo=bool(
                    request_payload.get("enable_visitor_photo", True)
                ),
                enable_leave_at_gate=bool(
                    request_payload.get("enable_leave_at_gate", False)
                ),
                enable_notice_board=bool(
                    request_payload.get("enable_notice_board", False)
                ),
            )
        )

        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 400

        return (
            jsonify(
                {
                    "success": True,
                    "message": response_message,
                    "data": {"plan_id": new_plan_id},
                }
            ),
            201,
        )

    # -------------------------------------------------------------------------
    # ONBOARDED SOCIETY CLIENTS ENDPOINTS (/api/central/clients)
    # -------------------------------------------------------------------------

    @central_crm_blueprint.route("/clients", methods=["GET"])
    @require_super_admin
    def handle_get_all_society_clients():
        society_clients = onboarding_service.retrieve_all_onboarded_societies()
        return jsonify({"success": True, "data": society_clients}), 200

    @central_crm_blueprint.route("/clients", methods=["POST"])
    @require_super_admin
    def handle_onboard_society_client():
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        required_fields = [
            "society_legal_name",
            "society_unique_code",
            "city_name",
            "rwa_contact_person_name",
            "rwa_contact_phone_number",
            "subscribed_plan_id",
        ]
        for field_name in required_fields:
            if not request_payload.get(field_name):
                return (
                    jsonify(
                        {
                            "success": False,
                            "error_code": "MISSING_REQUIRED_FIELD",
                            "message": f"Field '{field_name}' is required.",
                        }
                    ),
                    400,
                )

        is_successful, response_message, onboarding_data = (
            onboarding_service.onboard_new_society_client(
                society_legal_name=str(request_payload["society_legal_name"]),
                society_unique_code=str(request_payload["society_unique_code"]),
                city_name=str(request_payload["city_name"]),
                rwa_contact_person_name=str(request_payload["rwa_contact_person_name"]),
                rwa_contact_phone_number=str(
                    request_payload["rwa_contact_phone_number"]
                ),
                subscribed_plan_id=int(request_payload["subscribed_plan_id"]),
                state_name=str(request_payload.get("state_name", "Gujarat")),
                registration_number=request_payload.get("registration_number"),
                billing_address=request_payload.get("billing_address"),
                gstin_number=request_payload.get("gstin_number"),
                rwa_contact_email_address=request_payload.get("rwa_contact_email_address"),
                associated_lead_id=(
                    int(request_payload["associated_lead_id"])
                    if request_payload.get("associated_lead_id")
                    else None
                ),
            )
        )

        if not is_successful:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "ONBOARDING_FAILED",
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
                    "data": onboarding_data,
                }
            ),
            201,
        )

    @central_crm_blueprint.route(
        "/clients/<int:society_id>/entitlements", methods=["PUT"]
    )
    @require_super_admin
    def handle_update_society_entitlements(society_id: int):
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload:
            return jsonify({"success": False, "message": "Invalid JSON body."}), 400

        is_successful, response_message = (
            onboarding_service.update_society_entitlements_and_licensing(
                society_id=society_id,
                max_gates_allowed=int(request_payload.get("max_gates_allowed", 2)),
                photo_retention_days=int(request_payload.get("photo_retention_days", 45)),
                enable_walkin_approval=bool(
                    request_payload.get("enable_walkin_approval", True)
                ),
                enable_preapproval_passcode=bool(
                    request_payload.get("enable_preapproval_passcode", True)
                ),
                enable_visitor_photo=bool(
                    request_payload.get("enable_visitor_photo", True)
                ),
                enable_leave_at_gate=bool(
                    request_payload.get("enable_leave_at_gate", False)
                ),
                enable_notice_board=bool(
                    request_payload.get("enable_notice_board", False)
                ),
                license_status=str(request_payload.get("license_status", "ACTIVE")),
                subscription_expiry_date=str(
                    request_payload.get("subscription_expiry_date", "2027-12-31")
                ),
            )
        )

        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 400

        return jsonify({"success": True, "message": response_message}), 200

    # -------------------------------------------------------------------------
    # INVOICES ENDPOINTS (/api/central/invoices)
    # -------------------------------------------------------------------------

    @central_crm_blueprint.route("/invoices", methods=["GET"])
    @require_super_admin
    def handle_get_all_invoices():
        invoices_list = onboarding_service.retrieve_all_invoices()
        return jsonify({"success": True, "data": invoices_list}), 200

    @central_crm_blueprint.route(
        "/invoices/<int:invoice_id>/status", methods=["PATCH"]
    )
    @require_super_admin
    def handle_update_invoice_status(invoice_id: int):
        request_payload: Optional[Dict[str, Any]] = request.get_json(silent=True)
        if not request_payload or "payment_status" not in request_payload:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "'payment_status' is required.",
                    }
                ),
                400,
            )

        is_successful, response_message = onboarding_service.update_invoice_status(
            invoice_id=invoice_id,
            payment_status=str(request_payload["payment_status"]),
        )

        if not is_successful:
            return jsonify({"success": False, "message": response_message}), 400

        return jsonify({"success": True, "message": response_message}), 200

    return central_crm_blueprint
