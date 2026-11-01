"""
Smart Nivas - Society Accounts Payable & Expense Controller
Presentation layer handling HTTP routing, request validation, and responses for Accounts Payable.
Strictly follows SKILL.md: Zero single-letter variables, descriptive names, SOLID architecture.
"""

from typing import Any, Dict, Optional
from flask import Blueprint, request, jsonify, g as flask_global_context

from backend_api.services.society_accounts_payable_service import (
    SocietyAccountsPayableService,
)
from backend_api.middlewares.jwt_authentication_middleware import (
    AuthenticatedUserContext,
)
from backend_api.middlewares.tenant_privacy_and_entitlement_middleware import (
    require_society_permission,
)

def create_society_accounts_payable_blueprint() -> Blueprint:
    accounts_payable_blueprint = Blueprint("society_accounts_payable", __name__)
    require_admin = require_society_permission(allowed_roles=["SOCIETY_ADMIN"])

    # =========================================================================
    # 1. CHART OF ACCOUNTS (EXPENSE HEADS)
    # =========================================================================

    @accounts_payable_blueprint.route("/expense-heads", methods=["GET"])
    @require_admin
    def handle_get_chart_of_accounts():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        only_active_flag = request.args.get("only_active", "false").lower() == "true"
        try:
            expense_heads = SocietyAccountsPayableService.get_expense_heads(
                society_id=user_context.society_id,
                only_active=only_active_flag
            )
            return jsonify({"success": True, "expense_heads": expense_heads}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/expense-heads", methods=["POST"])
    @require_admin
    def handle_create_chart_of_accounts_head():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        request_payload = request.get_json() or {}
        category_code = request_payload.get("category_code")
        head_name = request_payload.get("head_name")
        description = request_payload.get("description")

        if not category_code or not head_name:
            return jsonify({"success": False, "error_message": "Both category_code and head_name are required."}), 400

        try:
            result_dictionary = SocietyAccountsPayableService.add_expense_head(
                society_id=user_context.society_id,
                category_code=category_code,
                head_name=head_name,
                description=description
            )
            return jsonify(result_dictionary), 201
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/expense-heads/<int:expense_head_id>", methods=["PUT"])
    @require_admin
    def handle_update_chart_of_accounts_head(expense_head_id: int):
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        request_payload = request.get_json() or {}
        category_code = request_payload.get("category_code")
        head_name = request_payload.get("head_name")
        description = request_payload.get("description")
        is_active = request_payload.get("is_active", True)

        if not category_code or not head_name:
            return jsonify({"success": False, "error_message": "Both category_code and head_name are required."}), 400

        try:
            result_dictionary = SocietyAccountsPayableService.update_expense_head(
                expense_head_id=expense_head_id,
                society_id=user_context.society_id,
                category_code=category_code,
                head_name=head_name,
                description=description,
                is_active=is_active
            )
            return jsonify(result_dictionary), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    # =========================================================================
    # 2. TDS TAX RATES CONFIGURATION
    # =========================================================================

    @accounts_payable_blueprint.route("/tds-rates", methods=["GET"])
    @require_admin
    def handle_get_tds_tax_rates():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        only_active_flag = request.args.get("only_active", "false").lower() == "true"
        try:
            tds_rules = SocietyAccountsPayableService.get_tds_configurations(
                society_id=user_context.society_id,
                only_active=only_active_flag
            )
            return jsonify({"success": True, "tds_rates": tds_rules}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/tds-rates", methods=["POST"])
    @require_admin
    def handle_create_tds_tax_rate():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        request_payload = request.get_json() or {}
        section_code = request_payload.get("section_code")
        vendor_type = request_payload.get("vendor_type")
        tds_percentage = request_payload.get("tds_percentage")
        threshold_limit_inr = request_payload.get("threshold_limit_inr", 30000.00)

        if not section_code or not vendor_type or tds_percentage is None:
            return jsonify({"success": False, "error_message": "section_code, vendor_type, and tds_percentage are required."}), 400

        try:
            result_dictionary = SocietyAccountsPayableService.add_tds_configuration(
                society_id=user_context.society_id,
                section_code=section_code,
                vendor_type=vendor_type,
                tds_percentage=tds_percentage,
                threshold_limit_inr=threshold_limit_inr
            )
            return jsonify(result_dictionary), 201
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/tds-rates/<int:tds_config_id>", methods=["PUT"])
    @require_admin
    def handle_update_tds_tax_rate(tds_config_id: int):
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        request_payload = request.get_json() or {}
        section_code = request_payload.get("section_code")
        vendor_type = request_payload.get("vendor_type")
        tds_percentage = request_payload.get("tds_percentage")
        threshold_limit_inr = request_payload.get("threshold_limit_inr", 30000.00)
        is_active = request_payload.get("is_active", True)

        if not section_code or not vendor_type or tds_percentage is None:
            return jsonify({"success": False, "error_message": "section_code, vendor_type, and tds_percentage are required."}), 400

        try:
            result_dictionary = SocietyAccountsPayableService.update_tds_configuration(
                tds_config_id=tds_config_id,
                society_id=user_context.society_id,
                section_code=section_code,
                vendor_type=vendor_type,
                tds_percentage=tds_percentage,
                threshold_limit_inr=threshold_limit_inr,
                is_active=is_active
            )
            return jsonify(result_dictionary), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    # =========================================================================
    # 3. VENDOR DIRECTORY
    # =========================================================================

    @accounts_payable_blueprint.route("/vendors", methods=["GET"])
    @require_admin
    def handle_get_vendor_directory():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        only_active_flag = request.args.get("only_active", "false").lower() == "true"
        try:
            vendors = SocietyAccountsPayableService.get_vendors(
                society_id=user_context.society_id,
                only_active=only_active_flag
            )
            return jsonify({"success": True, "vendors": vendors}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/vendors", methods=["POST"])
    @require_admin
    def handle_create_vendor():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        request_payload = request.get_json() or {}
        vendor_name = request_payload.get("vendor_name")
        contact_phone = request_payload.get("contact_phone")
        vendor_type = request_payload.get("vendor_type", "Contractor - Company")

        if not vendor_name or not contact_phone:
            return jsonify({"success": False, "error_message": "vendor_name and contact_phone are required."}), 400

        try:
            result_dictionary = SocietyAccountsPayableService.create_vendor(
                society_id=user_context.society_id,
                vendor_name=vendor_name,
                contact_phone=contact_phone,
                vendor_type=vendor_type,
                contact_person=request_payload.get("contact_person"),
                contact_email=request_payload.get("contact_email"),
                gstin=request_payload.get("gstin"),
                pan_number=request_payload.get("pan_number"),
                default_tds_config_id=request_payload.get("default_tds_config_id"),
                bank_name=request_payload.get("bank_name"),
                bank_account_number=request_payload.get("bank_account_number"),
                bank_ifsc_code=request_payload.get("bank_ifsc_code"),
                upi_id=request_payload.get("upi_id"),
                service_description=request_payload.get("service_description")
            )
            return jsonify(result_dictionary), 201
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/vendors/<int:vendor_id>", methods=["PUT"])
    @require_admin
    def handle_update_vendor(vendor_id: int):
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        request_payload = request.get_json() or {}
        vendor_name = request_payload.get("vendor_name")
        contact_phone = request_payload.get("contact_phone")
        vendor_type = request_payload.get("vendor_type", "Contractor - Company")
        is_active = request_payload.get("is_active", True)

        if not vendor_name or not contact_phone:
            return jsonify({"success": False, "error_message": "vendor_name and contact_phone are required."}), 400

        try:
            result_dictionary = SocietyAccountsPayableService.update_vendor(
                vendor_id=vendor_id,
                society_id=user_context.society_id,
                vendor_name=vendor_name,
                contact_phone=contact_phone,
                vendor_type=vendor_type,
                contact_person=request_payload.get("contact_person"),
                contact_email=request_payload.get("contact_email"),
                gstin=request_payload.get("gstin"),
                pan_number=request_payload.get("pan_number"),
                default_tds_config_id=request_payload.get("default_tds_config_id"),
                bank_name=request_payload.get("bank_name"),
                bank_account_number=request_payload.get("bank_account_number"),
                bank_ifsc_code=request_payload.get("bank_ifsc_code"),
                upi_id=request_payload.get("upi_id"),
                service_description=request_payload.get("service_description"),
                is_active=is_active
            )
            return jsonify(result_dictionary), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    # =========================================================================
    # 4. ANNUAL MAINTENANCE CONTRACTS (AMC TRACKER)
    # =========================================================================

    @accounts_payable_blueprint.route("/amc-contracts", methods=["GET"])
    @require_admin
    def handle_get_amc_contracts():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        try:
            contracts = SocietyAccountsPayableService.get_amc_contracts(society_id=user_context.society_id)
            return jsonify({"success": True, "amc_contracts": contracts}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/amc-contracts", methods=["POST"])
    @require_admin
    def handle_create_amc_contract():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        request_payload = request.get_json() or {}
        vendor_id = request_payload.get("vendor_id")
        expense_head_id = request_payload.get("expense_head_id")
        contract_title = request_payload.get("contract_title")
        start_date = request_payload.get("start_date")
        end_date = request_payload.get("end_date")
        contract_value_inr = request_payload.get("contract_value_inr")

        if not vendor_id or not expense_head_id or not contract_title or not start_date or not end_date or contract_value_inr is None:
            return jsonify({"success": False, "error_message": "Missing required fields for AMC contract."}), 400

        try:
            result_dictionary = SocietyAccountsPayableService.create_amc_contract(
                society_id=user_context.society_id,
                vendor_id=vendor_id,
                expense_head_id=expense_head_id,
                contract_title=contract_title,
                start_date=start_date,
                end_date=end_date,
                contract_value_inr=contract_value_inr,
                billing_frequency=request_payload.get("billing_frequency", "QUARTERLY"),
                contract_document_url=request_payload.get("contract_document_url"),
                notes=request_payload.get("notes")
            )
            return jsonify(result_dictionary), 201
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/amc-contracts/<int:amc_id>", methods=["PUT"])
    @require_admin
    def handle_update_amc_contract(amc_id: int):
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        request_payload = request.get_json() or {}
        vendor_id = request_payload.get("vendor_id")
        expense_head_id = request_payload.get("expense_head_id")
        contract_title = request_payload.get("contract_title")
        start_date = request_payload.get("start_date")
        end_date = request_payload.get("end_date")
        contract_value_inr = request_payload.get("contract_value_inr")
        status = request_payload.get("status", "ACTIVE")

        if not vendor_id or not expense_head_id or not contract_title or not start_date or not end_date or contract_value_inr is None:
            return jsonify({"success": False, "error_message": "Missing required fields for AMC contract."}), 400

        try:
            result_dictionary = SocietyAccountsPayableService.update_amc_contract(
                amc_id=amc_id,
                society_id=user_context.society_id,
                vendor_id=vendor_id,
                expense_head_id=expense_head_id,
                contract_title=contract_title,
                start_date=start_date,
                end_date=end_date,
                contract_value_inr=contract_value_inr,
                billing_frequency=request_payload.get("billing_frequency", "QUARTERLY"),
                contract_document_url=request_payload.get("contract_document_url"),
                notes=request_payload.get("notes"),
                status=status
            )
            return jsonify(result_dictionary), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    # =========================================================================
    # 5. EXPENSE VOUCHER JOURNAL & AUDIT TRAIL
    # =========================================================================

    @accounts_payable_blueprint.route("/vouchers", methods=["GET"])
    @require_admin
    def handle_get_expense_vouchers():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        vendor_id = request.args.get("vendor_id", type=int)
        expense_head_id = request.args.get("expense_head_id", type=int)

        try:
            vouchers = SocietyAccountsPayableService.get_expense_vouchers(
                society_id=user_context.society_id,
                start_date=start_date,
                end_date=end_date,
                vendor_id=vendor_id,
                expense_head_id=expense_head_id
            )
            return jsonify({"success": True, "vouchers": vouchers}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/vouchers", methods=["POST"])
    @require_admin
    def handle_record_expense_voucher():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        request_payload = request.get_json() or {}

        voucher_date = request_payload.get("voucher_date")
        expense_head_id = request_payload.get("expense_head_id")
        gross_amount_inr = request_payload.get("gross_amount_inr")
        payment_mode = request_payload.get("payment_mode", "BANK_TRANSFER")
        payment_date = request_payload.get("payment_date", voucher_date)

        if not voucher_date or not expense_head_id or gross_amount_inr is None:
            return jsonify({"success": False, "error_message": "voucher_date, expense_head_id, and gross_amount_inr are required."}), 400

        try:
            result_dictionary = SocietyAccountsPayableService.record_expense_voucher(
                society_id=user_context.society_id,
                voucher_date=voucher_date,
                expense_head_id=expense_head_id,
                gross_amount_inr=gross_amount_inr,
                payment_mode=payment_mode,
                payment_date=payment_date,
                vendor_id=request_payload.get("vendor_id"),
                amc_id=request_payload.get("amc_id"),
                tds_percentage=request_payload.get("tds_percentage", 0.00),
                payment_reference_number=request_payload.get("payment_reference_number"),
                invoice_bill_number=request_payload.get("invoice_bill_number"),
                invoice_attachment_url=request_payload.get("invoice_attachment_url"),
                invoice_attachment_filename=request_payload.get("invoice_attachment_filename"),
                payment_status=request_payload.get("payment_status", "PAID"),
                remarks=request_payload.get("remarks"),
                recorded_by_user_id=user_context.user_id
            )
            return jsonify(result_dictionary), 201
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    # =========================================================================
    # 6. FINANCIAL AUDITING & REPORTS
    # =========================================================================

    @accounts_payable_blueprint.route("/reports/profit-loss", methods=["GET"])
    @require_admin
    def handle_get_profit_and_loss_report():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        start_date = request.args.get("start_date", "2026-04-01")
        end_date = request.args.get("end_date", "2027-03-31")

        try:
            report_data = SocietyAccountsPayableService.get_profit_and_loss_statement(
                society_id=user_context.society_id,
                start_date=start_date,
                end_date=end_date
            )
            return jsonify({"success": True, "report": report_data}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/reports/cashbook-ledger", methods=["GET"])
    @require_admin
    def handle_get_cashbook_ledger_report():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        start_date = request.args.get("start_date", "2026-04-01")
        end_date = request.args.get("end_date", "2027-03-31")

        try:
            ledger_data = SocietyAccountsPayableService.get_cashbook_ledger(
                society_id=user_context.society_id,
                start_date=start_date,
                end_date=end_date
            )
            return jsonify({"success": True, "ledger": ledger_data}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @accounts_payable_blueprint.route("/reports/vendor-payouts", methods=["GET"])
    @require_admin
    def handle_get_vendor_payout_report():
        user_context: AuthenticatedUserContext = flask_global_context.authenticated_user_context
        vendor_id = request.args.get("vendor_id", type=int)
        financial_year_start_date = request.args.get("start_date", "2026-04-01")
        financial_year_end_date = request.args.get("end_date", "2027-03-31")

        if not vendor_id:
            return jsonify({"success": False, "error_message": "vendor_id is required for vendor payout summary."}), 400

        try:
            payout_summary = SocietyAccountsPayableService.get_vendor_payout_report(
                society_id=user_context.society_id,
                vendor_id=vendor_id,
                financial_year_start_date=financial_year_start_date,
                financial_year_end_date=financial_year_end_date
            )
            return jsonify({"success": True, "payout_summary": payout_summary}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    return accounts_payable_blueprint
