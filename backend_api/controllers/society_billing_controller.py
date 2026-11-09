"""
Society Billing Controller for Smart Nivas
Presentation Layer (Single Responsibility Principle) handling HTTP request/response validation.
Routes:
  GET  /api/admin/billing/configuration
  PUT  /api/admin/billing/configuration
  GET  /api/admin/billing/heads
  POST /api/admin/billing/heads
  GET  /api/admin/billing/dashboard-summary
  POST /api/admin/billing/invoices/preview
  POST /api/admin/billing/invoices/generate
  GET  /api/admin/billing/ledger
  GET  /api/admin/billing/ledger/<flat_id>
  POST /api/admin/billing/payments/record
  GET  /api/admin/billing/invoices/<invoice_id>/upi-qr
"""

from typing import Any, Dict, Optional
from flask import Blueprint, request, jsonify, g as flask_global_context

from backend_api.services.society_billing_service import SocietyBillingService
from backend_api.middlewares.jwt_authentication_middleware import (
    AuthenticatedUserContext,
)
from backend_api.middlewares.tenant_privacy_and_entitlement_middleware import (
    require_society_permission,
)


def create_society_billing_blueprint(
    billing_service: Optional[SocietyBillingService] = None,
) -> Blueprint:
    billing_blueprint = Blueprint("society_billing", __name__)
    if billing_service is None:
        billing_service = SocietyBillingService()

    # Helper decorator for society admin billing routes
    require_admin = require_society_permission(allowed_roles=["SOCIETY_ADMIN"])
    require_any = require_society_permission(allowed_roles=["SOCIETY_ADMIN", "RESIDENT", "GUARD"])

    # =========================================================================
    # Configuration & Heads
    # =========================================================================

    @billing_blueprint.route("/configuration", methods=["GET"])
    @require_admin
    def handle_get_billing_configuration():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        data = billing_service.get_or_initialize_configuration(user_context.society_id)
        return jsonify({"success": True, "data": data}), 200

    @billing_blueprint.route("/configuration", methods=["PUT"])
    @require_admin
    def handle_update_billing_configuration():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        payload = request.get_json(silent=True) or {}
        success, message, data = billing_service.update_configuration(
            user_context.society_id, payload
        )
        status_code = 200 if success else 400
        return jsonify({"success": success, "message": message, "data": data}), status_code

    @billing_blueprint.route("/heads", methods=["POST"])
    @require_admin
    def handle_create_billing_head():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        payload = request.get_json(silent=True) or {}
        head_name = payload.get("head_name", "")
        amount = payload.get("default_amount_inr", 0.0)
        is_mand = payload.get("is_mandatory", False)

        success, message, head_id = billing_service.create_custom_billing_head(
            user_context.society_id, head_name, amount, is_mand
        )
        status_code = 201 if success else 400
        return jsonify({"success": success, "message": message, "data": {"head_id": head_id}}), status_code

    # =========================================================================
    # Dashboard Summary
    # =========================================================================

    @billing_blueprint.route("/dashboard-summary", methods=["GET"])
    @require_admin
    def handle_get_dashboard_summary():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        summary = billing_service.get_dashboard_summary(user_context.society_id)
        return jsonify({"success": True, "data": summary}), 200

    # =========================================================================
    # Invoices (Preview & Bulk Generation)
    # =========================================================================

    @billing_blueprint.route("/invoices/preview", methods=["POST"])
    @require_admin
    def handle_preview_invoices():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        payload = request.get_json(silent=True) or {}
        month = payload.get("billing_period_month", "")
        label = payload.get("billing_period_label", "")
        heads = payload.get("selected_heads", [])
        billing_cycle = payload.get("billing_cycle")

        if not month:
            return jsonify({"success": False, "message": "billing_period_month is required"}), 400

        preview = billing_service.preview_invoice_generation(
            society_id=user_context.society_id,
            billing_period_month=month,
            billing_period_label=label,
            selected_heads=heads,
            billing_cycle_override=billing_cycle,
        )
        return jsonify({"success": True, "data": preview}), 200

    @billing_blueprint.route("/invoices/generate", methods=["POST"])
    @require_admin
    def handle_generate_bulk_invoices():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        payload = request.get_json(silent=True) or {}
        month = payload.get("billing_period_month", "")
        label = payload.get("billing_period_label", "")
        due_date = payload.get("due_date", "")
        heads = payload.get("selected_heads", [])
        billing_cycle = payload.get("billing_cycle")

        if not month or not due_date:
            return jsonify({"success": False, "message": "Month and due_date are required."}), 400

        success, message, result_data = billing_service.generate_bulk_invoices(
            society_id=user_context.society_id,
            billing_period_month=month,
            billing_period_label=label,
            due_date_str=due_date,
            selected_heads=heads,
            billing_cycle_override=billing_cycle,
        )
        status_code = 200 if success else 400
        return jsonify({"success": success, "message": message, "data": result_data}), status_code

    @billing_blueprint.route("/flats/<int:flat_id>/classification", methods=["PUT"])
    @require_admin
    def handle_update_flat_classification(flat_id: int):
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        payload = request.get_json(silent=True) or {}
        flat_type = payload.get("flat_type", "REGULAR")
        occupancy_status = payload.get("occupancy_status", "OWNER_OCCUPIED")

        success, message = billing_service.update_flat_classification(
            society_id=user_context.society_id,
            flat_id=flat_id,
            flat_type=flat_type,
            occupancy_status=occupancy_status,
        )
        status_code = 200 if success else 400
        return jsonify({"success": success, "message": message}), status_code

    @billing_blueprint.route("/notice-circular", methods=["GET"])
    @require_any
    def handle_get_notice_circular():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        period_label = request.args.get("period_label")
        data = billing_service.get_society_notice_circular_data(
            user_context.society_id, period_label=period_label
        )
        return jsonify({"success": True, "data": data}), 200

    # =========================================================================
    # Flat Ledger & Statement
    # =========================================================================

    @billing_blueprint.route("/ledger", methods=["GET"])
    @require_admin
    def handle_get_flats_ledger():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        ledger_flats = billing_service.get_flats_ledger(user_context.society_id)
        return jsonify({"success": True, "data": ledger_flats}), 200

    @billing_blueprint.route("/ledger/<int:flat_id>", methods=["GET"])
    @require_admin
    def handle_get_flat_statement(flat_id: int):
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        statement = billing_service.get_flat_statement(user_context.society_id, flat_id)
        return jsonify({"success": True, "data": statement}), 200

    # =========================================================================
    # Payments Reconciliation
    # =========================================================================

    @billing_blueprint.route("/payments/record", methods=["POST"])
    @require_admin
    def handle_record_payment():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        payload = request.get_json(silent=True) or {}
        if not payload.get("flat_id") or not payload.get("amount_paid_inr"):
            return jsonify({"success": False, "message": "flat_id and amount_paid_inr are required."}), 400

        success, message, data = billing_service.record_manual_payment(
            society_id=user_context.society_id,
            recorded_by_user_id=user_context.user_id,
            payment_payload=payload,
        )
        status_code = 201 if success else 400
        return jsonify({"success": success, "message": message, "data": data}), status_code

    # =========================================================================
    # Dynamic UPI QR Code
    # =========================================================================

    @billing_blueprint.route("/invoices/<int:invoice_id>/upi-qr", methods=["GET"])
    @require_any
    def handle_get_invoice_upi_qr(invoice_id: int):
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        upi_details = billing_service.generate_invoice_upi_details(
            society_id=user_context.society_id, invoice_id=invoice_id
        )
        if not upi_details:
            return jsonify({"success": False, "message": "Invoice or configuration not found."}), 404
        return jsonify({"success": True, "data": upi_details}), 200

    # =========================================================================
    # Financial & Statutory Reports Endpoints
    # =========================================================================

    @billing_blueprint.route("/reports/defaulters-aging", methods=["GET"])
    @require_admin
    def handle_get_defaulters_aging_report():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        as_of_date = request.args.get("as_of_date")
        report_data = billing_service.get_defaulters_aging_report(
            user_context.society_id, as_of_date=as_of_date
        )
        return jsonify({"success": True, "data": report_data}), 200

    @billing_blueprint.route("/reports/collections", methods=["GET"])
    @require_admin
    def handle_get_collections_report():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        group_by = request.args.get("group_by", "DAILY").upper()

        if not start_date or not end_date:
            return jsonify({"success": False, "message": "start_date and end_date query parameters are required."}), 400

        report_data = billing_service.get_collection_report(
            user_context.society_id, start_date=start_date, end_date=end_date, group_by=group_by
        )
        return jsonify({"success": True, "data": report_data}), 200

    @billing_blueprint.route("/reports/tax-gst-output", methods=["GET"])
    @require_admin
    def handle_get_tax_gst_report():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return jsonify({"success": False, "message": "start_date and end_date query parameters are required."}), 400

        report_data = billing_service.get_tax_gst_output_report(
            user_context.society_id, start_date=start_date, end_date=end_date
        )
        return jsonify({"success": True, "data": report_data}), 200

    return billing_blueprint
