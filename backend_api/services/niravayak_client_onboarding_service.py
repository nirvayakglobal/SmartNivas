"""
Niravayak Client Onboarding Service for Smart Nivas
Business Logic Layer (Single Responsibility Principle) handling:
- Lead stage updates and conversions
- Multi-step client onboarding inside ACID transaction scope
  (Society creation + Plan flag inheritance + Bootstrap Admin creation + B2B Invoice generation)
- Entitlement flag updates
- Plan creation and invoice status management

Follows SOLID principles (DIP constructor injection), ACID principles, and SKILL.md standards.
"""

import secrets
import string
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

from backend_api.repositories.niravayak_crm_and_licensing_repository import (
    NiravayakCrmAndLicensingRepository,
)
from backend_api.database.mysql_connection_pool_manager import (
    MySQLConnectionPoolManager,
    global_database_connection_manager,
)


class NiravayakClientOnboardingService:
    """
    Service orchestrating B2B CRM sales workflows, plan management,
    and atomic multi-step client onboarding.
    """

    def __init__(
        self,
        crm_repository: NiravayakCrmAndLicensingRepository,
        database_connection_manager: MySQLConnectionPoolManager = global_database_connection_manager,
    ) -> None:
        self._crm_repository: NiravayakCrmAndLicensingRepository = crm_repository
        self._database_connection_manager: MySQLConnectionPoolManager = (
            database_connection_manager
        )

    # -------------------------------------------------------------------------
    # LEAD MANAGEMENT
    # -------------------------------------------------------------------------

    def retrieve_all_pipeline_leads(self) -> List[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            crm_leads_list: List[Dict[str, Any]] = (
                self._crm_repository.get_all_crm_leads(database_cursor)
            )
            return crm_leads_list

    def capture_new_crm_lead(
        self,
        prospective_society_name: str,
        city_name: str,
        contact_person_name: str,
        contact_phone_number: str,
        contact_email_address: Optional[str] = None,
        follow_up_notes: Optional[str] = None,
    ) -> Tuple[bool, str, Optional[int]]:
        if not prospective_society_name.strip() or not contact_phone_number.strip():
            return False, "Prospective society name and phone number are required.", None

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            new_lead_id: int = self._crm_repository.create_crm_lead(
                database_cursor=database_cursor,
                prospective_society_name=prospective_society_name.strip(),
                city_name=city_name.strip(),
                contact_person_name=contact_person_name.strip(),
                contact_phone_number=contact_phone_number.strip(),
                contact_email_address=(
                    contact_email_address.strip() if contact_email_address else None
                ),
                pipeline_stage="NEW_LEAD",
                follow_up_notes=follow_up_notes.strip() if follow_up_notes else None,
            )
            return True, "Prospective lead captured successfully.", new_lead_id

    def update_lead_pipeline_stage(
        self,
        lead_id: int,
        pipeline_stage: str,
        follow_up_notes: Optional[str] = None,
    ) -> Tuple[bool, str]:
        valid_pipeline_stages = {
            "NEW_LEAD",
            "DEMO_SCHEDULED",
            "PROPOSAL_SENT",
            "WON",
            "LOST",
        }
        if pipeline_stage not in valid_pipeline_stages:
            return False, f"Invalid pipeline stage. Allowed: {valid_pipeline_stages}"

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            affected_row_count: int = (
                self._crm_repository.update_crm_lead_stage_and_notes(
                    database_cursor=database_cursor,
                    lead_id=lead_id,
                    pipeline_stage=pipeline_stage,
                    follow_up_notes=follow_up_notes,
                )
            )
            if affected_row_count == 0:
                return False, "Lead record not found."
            return True, "Lead stage updated successfully."

    # -------------------------------------------------------------------------
    # ATOMIC SOCIETY ONBOARDING WORKFLOW (ACID TRANSACTION)
    # -------------------------------------------------------------------------

    def onboard_new_society_client(
        self,
        society_legal_name: str,
        society_unique_code: str,
        city_name: str,
        rwa_contact_person_name: str,
        rwa_contact_phone_number: str,
        subscribed_plan_id: int,
        state_name: str = "Gujarat",
        registration_number: Optional[str] = None,
        billing_address: Optional[str] = None,
        gstin_number: Optional[str] = None,
        rwa_contact_email_address: Optional[str] = None,
        associated_lead_id: Optional[int] = None,
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        ATOMIC ACID WORKFLOW:
        1. Validates input and uniqueness of society_unique_code.
        2. Retrieves subscription plan to copy plan entitlement flags and calculate pricing.
        3. Inserts new society record.
        4. Generates cryptographically secure bootstrap activation token.
        5. Inserts root SOCIETY_ADMIN user with is_bootstrap_pending = TRUE.
        6. Generates initial B2B GST invoice.
        7. If associated_lead_id is present, marks lead as WON.
        All statements commit together, or completely roll back if any error occurs.
        """
        cleaned_society_code: str = society_unique_code.strip().upper()

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            # 1. Check unique code collision
            is_code_taken: bool = (
                self._crm_repository.check_society_unique_code_exists(
                    database_cursor=database_cursor,
                    society_unique_code=cleaned_society_code,
                )
            )
            if is_code_taken:
                return (
                    False,
                    f"Society unique code '{cleaned_society_code}' is already registered.",
                    None,
                )

            # 2. Retrieve plan record
            plan_record: Optional[Dict[str, Any]] = (
                self._crm_repository.get_subscription_plan_by_id(
                    database_cursor=database_cursor,
                    plan_id=subscribed_plan_id,
                )
            )
            if not plan_record:
                return (
                    False,
                    f"Subscription plan with ID {subscribed_plan_id} does not exist.",
                    None,
                )

            # Calculate billing and subscription validity dates
            current_date: datetime = datetime.now(timezone.utc)
            subscription_start_date_string: str = current_date.strftime("%Y-%m-%d")

            # Default 1-year validity for yearly plan
            billing_cycle: str = plan_record.get("billing_cycle", "YEARLY")
            if billing_cycle == "MONTHLY":
                expiry_date = current_date + timedelta(days=30)
            elif billing_cycle == "QUARTERLY":
                expiry_date = current_date + timedelta(days=90)
            else:
                expiry_date = current_date + timedelta(days=365)
            subscription_expiry_date_string: str = expiry_date.strftime("%Y-%m-%d")

            # 3. Insert society record inheriting plan entitlements
            new_society_id: int = self._crm_repository.insert_society_client(
                database_cursor=database_cursor,
                society_legal_name=society_legal_name.strip(),
                society_unique_code=cleaned_society_code,
                registration_number=(
                    registration_number.strip() if registration_number else None
                ),
                billing_address=billing_address.strip() if billing_address else None,
                city_name=city_name.strip(),
                state_name=state_name.strip(),
                gstin_number=gstin_number.strip() if gstin_number else None,
                rwa_contact_person_name=rwa_contact_person_name.strip(),
                rwa_contact_phone_number=rwa_contact_phone_number.strip(),
                rwa_contact_email_address=(
                    rwa_contact_email_address.strip()
                    if rwa_contact_email_address
                    else None
                ),
                subscribed_plan_id=subscribed_plan_id,
                max_gates_allowed=int(plan_record["max_gates_allowed"]),
                photo_retention_days=int(plan_record["photo_retention_days"]),
                enable_walkin_approval=bool(plan_record["enable_walkin_approval"]),
                enable_preapproval_passcode=bool(
                    plan_record["enable_preapproval_passcode"]
                ),
                enable_visitor_photo=bool(plan_record["enable_visitor_photo"]),
                enable_leave_at_gate=bool(plan_record["enable_leave_at_gate"]),
                enable_notice_board=bool(plan_record["enable_notice_board"]),
                license_status="ACTIVE",
                subscription_start_date=subscription_start_date_string,
                subscription_expiry_date=subscription_expiry_date_string,
            )

            # 4. Generate secure random bootstrap activation token (32 chars)
            bootstrap_activation_token: str = secrets.token_urlsafe(24)

            # 5. Insert root SOCIETY_ADMIN user record
            new_admin_user_id: int = (
                self._crm_repository.insert_initial_society_admin_user(
                    database_cursor=database_cursor,
                    society_id=new_society_id,
                    full_name=rwa_contact_person_name.strip(),
                    phone_number=rwa_contact_phone_number.strip(),
                    bootstrap_activation_token=bootstrap_activation_token,
                )
            )

            # 6. Calculate GST & Generate Initial B2B Invoice
            base_price_inr: float = float(plan_record["base_price_inr"])
            # 18% GST calculation
            gst_amount_inr: float = round(base_price_inr * 0.18, 2)
            total_amount_inr: float = round(base_price_inr + gst_amount_inr, 2)

            # Generate standard invoice number: INV-YEAR-SOCID-RANDOM
            random_invoice_suffix: str = "".join(
                secrets.choice(string.digits) for _ in range(4)
            )
            invoice_number: str = (
                f"INV-{current_date.year}-{cleaned_society_code}-{random_invoice_suffix}"
            )

            new_invoice_id: int = self._crm_repository.insert_b2b_invoice(
                database_cursor=database_cursor,
                society_id=new_society_id,
                invoice_number=invoice_number,
                base_amount_inr=base_price_inr,
                gst_amount_inr=gst_amount_inr,
                total_amount_inr=total_amount_inr,
                payment_status="PAID",
                billing_period_start=subscription_start_date_string,
                billing_period_end=subscription_expiry_date_string,
            )

            # 7. If lead exists, update stage to WON
            if associated_lead_id is not None:
                self._crm_repository.update_crm_lead_stage_and_notes(
                    database_cursor=database_cursor,
                    lead_id=associated_lead_id,
                    pipeline_stage="WON",
                    follow_up_notes=f"Converted to Society Client #{new_society_id} ({cleaned_society_code}).",
                )

        onboarding_summary_payload: Dict[str, Any] = {
            "society_id": new_society_id,
            "society_legal_name": society_legal_name,
            "society_unique_code": cleaned_society_code,
            "subscribed_plan_name": plan_record["plan_name"],
            "bootstrap_admin_user_id": new_admin_user_id,
            "bootstrap_activation_token": bootstrap_activation_token,
            "activation_link": f"/admin/activate?token={bootstrap_activation_token}",
            "invoice": {
                "invoice_id": new_invoice_id,
                "invoice_number": invoice_number,
                "total_amount_inr": total_amount_inr,
            },
        }

        return True, "Society client onboarded successfully.", onboarding_summary_payload

    # -------------------------------------------------------------------------
    # SOCIETY ENTITLEMENTS & LICENSE MANAGEMENT
    # -------------------------------------------------------------------------

    def retrieve_all_onboarded_societies(self) -> List[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            return self._crm_repository.get_all_onboarded_societies(database_cursor)

    def update_society_entitlements_and_licensing(
        self,
        society_id: int,
        max_gates_allowed: int,
        photo_retention_days: int,
        enable_walkin_approval: bool,
        enable_preapproval_passcode: bool,
        enable_visitor_photo: bool,
        enable_leave_at_gate: bool,
        enable_notice_board: bool,
        license_status: str,
        subscription_expiry_date: str,
    ) -> Tuple[bool, str]:
        valid_license_statuses = {"TRIAL", "ACTIVE", "GRACE_PERIOD", "SUSPENDED"}
        if license_status not in valid_license_statuses:
            return False, f"Invalid license status. Allowed: {valid_license_statuses}"

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            affected_row_count: int = (
                self._crm_repository.update_society_entitlements_and_license(
                    database_cursor=database_cursor,
                    society_id=society_id,
                    max_gates_allowed=max_gates_allowed,
                    photo_retention_days=photo_retention_days,
                    enable_walkin_approval=enable_walkin_approval,
                    enable_preapproval_passcode=enable_preapproval_passcode,
                    enable_visitor_photo=enable_visitor_photo,
                    enable_leave_at_gate=enable_leave_at_gate,
                    enable_notice_board=enable_notice_board,
                    license_status=license_status,
                    subscription_expiry_date=subscription_expiry_date,
                )
            )
            if affected_row_count == 0:
                return False, "Society record not found."
            return True, "Society entitlements and license updated successfully."

    # -------------------------------------------------------------------------
    # SUBSCRIPTION PLANS & INVOICES
    # -------------------------------------------------------------------------

    def retrieve_all_plans(self) -> List[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            return self._crm_repository.get_all_subscription_plans(database_cursor)

    def create_new_subscription_plan(
        self,
        plan_name: str,
        billing_cycle: str,
        base_price_inr: float,
        max_gates_allowed: int,
        photo_retention_days: int,
        enable_walkin_approval: bool,
        enable_preapproval_passcode: bool,
        enable_visitor_photo: bool,
        enable_leave_at_gate: bool,
        enable_notice_board: bool,
    ) -> Tuple[bool, str, Optional[int]]:
        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            new_plan_id: int = self._crm_repository.create_subscription_plan(
                database_cursor=database_cursor,
                plan_name=plan_name,
                billing_cycle=billing_cycle,
                base_price_inr=base_price_inr,
                max_gates_allowed=max_gates_allowed,
                photo_retention_days=photo_retention_days,
                enable_walkin_approval=enable_walkin_approval,
                enable_preapproval_passcode=enable_preapproval_passcode,
                enable_visitor_photo=enable_visitor_photo,
                enable_leave_at_gate=enable_leave_at_gate,
                enable_notice_board=enable_notice_board,
            )
            return True, "Subscription plan created successfully.", new_plan_id

    def retrieve_all_invoices(self) -> List[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as database_cursor:
            return self._crm_repository.get_all_b2b_invoices(database_cursor)

    def update_invoice_status(
        self,
        invoice_id: int,
        payment_status: str,
    ) -> Tuple[bool, str]:
        valid_statuses = {"UNPAID", "PAID", "CANCELLED"}
        if payment_status not in valid_statuses:
            return False, f"Invalid payment status. Allowed: {valid_statuses}"

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            affected_rows: int = self._crm_repository.update_invoice_payment_status(
                database_cursor=database_cursor,
                invoice_id=invoice_id,
                payment_status=payment_status,
            )
            if affected_rows == 0:
                return False, "Invoice record not found."
            return True, "Invoice payment status updated successfully."
