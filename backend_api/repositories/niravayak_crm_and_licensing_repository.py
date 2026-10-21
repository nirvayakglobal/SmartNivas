"""
Niravayak CRM and Licensing Repository for Smart Nivas
Data Access Layer (Single Responsibility Principle) strictly restricted to Part-A commercial tables:
- subscription_plans
- crm_leads
- societies
- b2b_invoices
- users (ONLY inserting/updating the initial SOCIETY_ADMIN bootstrap record)

Strictly blocks any access to wings, flats, visitor logs, notices, or residents.
All parameterized SQL uses %s placeholders. ZERO single-letter variables.
"""

from typing import Any, Dict, List, Optional
from pymysql.cursors import DictCursor


class NiravayakCrmAndLicensingRepository:
    """
    Repository dedicated exclusively to Niravayak Global B2B SaaS management,
    lead conversion, subscription plans, client onboarding, and billing.
    """

    # -------------------------------------------------------------------------
    # SUBSCRIPTION PLANS
    # -------------------------------------------------------------------------

    def get_all_subscription_plans(
        self,
        database_cursor: DictCursor,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all available subscription plans.
        """
        select_plans_query: str = (
            "SELECT plan_id, plan_name, billing_cycle, base_price_inr, "
            "max_gates_allowed, photo_retention_days, enable_walkin_approval, "
            "enable_preapproval_passcode, enable_visitor_photo, enable_leave_at_gate, "
            "enable_notice_board, created_at "
            "FROM subscription_plans "
            "ORDER BY base_price_inr ASC"
        )
        database_cursor.execute(select_plans_query)
        subscription_plan_records: List[Dict[str, Any]] = database_cursor.fetchall()
        return subscription_plan_records

    def get_subscription_plan_by_id(
        self,
        database_cursor: DictCursor,
        plan_id: int,
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single subscription plan by ID.
        """
        select_plan_query: str = (
            "SELECT plan_id, plan_name, billing_cycle, base_price_inr, "
            "max_gates_allowed, photo_retention_days, enable_walkin_approval, "
            "enable_preapproval_passcode, enable_visitor_photo, enable_leave_at_gate, "
            "enable_notice_board, created_at "
            "FROM subscription_plans "
            "WHERE plan_id = %s"
        )
        database_cursor.execute(select_plan_query, (plan_id,))
        subscription_plan_record: Optional[Dict[str, Any]] = (
            database_cursor.fetchone()
        )
        return subscription_plan_record

    def create_subscription_plan(
        self,
        database_cursor: DictCursor,
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
    ) -> int:
        """
        Inserts a new subscription plan record.
        """
        insert_plan_query: str = (
            "INSERT INTO subscription_plans ("
            "plan_name, billing_cycle, base_price_inr, max_gates_allowed, "
            "photo_retention_days, enable_walkin_approval, enable_preapproval_passcode, "
            "enable_visitor_photo, enable_leave_at_gate, enable_notice_board"
            ") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        )
        database_cursor.execute(
            insert_plan_query,
            (
                plan_name,
                billing_cycle,
                base_price_inr,
                max_gates_allowed,
                photo_retention_days,
                enable_walkin_approval,
                enable_preapproval_passcode,
                enable_visitor_photo,
                enable_leave_at_gate,
                enable_notice_board,
            ),
        )
        return database_cursor.lastrowid

    def update_subscription_plan(
        self,
        database_cursor: DictCursor,
        plan_id: int,
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
    ) -> int:
        """
        Updates an existing subscription plan record.
        """
        update_plan_query: str = (
            "UPDATE subscription_plans SET "
            "plan_name = %s, billing_cycle = %s, base_price_inr = %s, "
            "max_gates_allowed = %s, photo_retention_days = %s, "
            "enable_walkin_approval = %s, enable_preapproval_passcode = %s, "
            "enable_visitor_photo = %s, enable_leave_at_gate = %s, "
            "enable_notice_board = %s "
            "WHERE plan_id = %s"
        )
        database_cursor.execute(
            update_plan_query,
            (
                plan_name,
                billing_cycle,
                base_price_inr,
                max_gates_allowed,
                photo_retention_days,
                enable_walkin_approval,
                enable_preapproval_passcode,
                enable_visitor_photo,
                enable_leave_at_gate,
                enable_notice_board,
                plan_id,
            ),
        )
        return database_cursor.rowcount

    # -------------------------------------------------------------------------
    # CRM LEADS
    # -------------------------------------------------------------------------

    def get_all_crm_leads(
        self,
        database_cursor: DictCursor,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all leads in the sales pipeline.
        """
        select_leads_query: str = (
            "SELECT lead_id, prospective_society_name, city_name, "
            "contact_person_name, contact_phone_number, contact_email_address, "
            "pipeline_stage, follow_up_notes, created_at "
            "FROM crm_leads "
            "ORDER BY created_at DESC"
        )
        database_cursor.execute(select_leads_query)
        crm_lead_records: List[Dict[str, Any]] = database_cursor.fetchall()
        return crm_lead_records

    def get_crm_lead_by_id(
        self,
        database_cursor: DictCursor,
        lead_id: int,
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves a lead by primary key.
        """
        select_lead_query: str = (
            "SELECT lead_id, prospective_society_name, city_name, "
            "contact_person_name, contact_phone_number, contact_email_address, "
            "pipeline_stage, follow_up_notes, created_at "
            "FROM crm_leads "
            "WHERE lead_id = %s"
        )
        database_cursor.execute(select_lead_query, (lead_id,))
        crm_lead_record: Optional[Dict[str, Any]] = database_cursor.fetchone()
        return crm_lead_record

    def create_crm_lead(
        self,
        database_cursor: DictCursor,
        prospective_society_name: str,
        city_name: str,
        contact_person_name: str,
        contact_phone_number: str,
        contact_email_address: Optional[str] = None,
        pipeline_stage: str = "NEW_LEAD",
        follow_up_notes: Optional[str] = None,
    ) -> int:
        """
        Inserts a new prospective lead into the pipeline.
        """
        insert_lead_query: str = (
            "INSERT INTO crm_leads ("
            "prospective_society_name, city_name, contact_person_name, "
            "contact_phone_number, contact_email_address, pipeline_stage, follow_up_notes"
            ") VALUES (%s, %s, %s, %s, %s, %s, %s)"
        )
        database_cursor.execute(
            insert_lead_query,
            (
                prospective_society_name,
                city_name,
                contact_person_name,
                contact_phone_number,
                contact_email_address,
                pipeline_stage,
                follow_up_notes,
            ),
        )
        return database_cursor.lastrowid

    def update_crm_lead_stage_and_notes(
        self,
        database_cursor: DictCursor,
        lead_id: int,
        pipeline_stage: str,
        follow_up_notes: Optional[str] = None,
    ) -> int:
        """
        Updates pipeline stage and notes for a lead.
        """
        update_lead_query: str = (
            "UPDATE crm_leads SET pipeline_stage = %s, follow_up_notes = %s "
            "WHERE lead_id = %s"
        )
        database_cursor.execute(update_lead_query, (pipeline_stage, follow_up_notes, lead_id))
        return database_cursor.rowcount

    # -------------------------------------------------------------------------
    # ONBOARDED SOCIETIES & ENTITLEMENTS
    # -------------------------------------------------------------------------

    def get_all_onboarded_societies(
        self,
        database_cursor: DictCursor,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all onboarded client societies with their active subscription plan details
        and society admin bootstrap activation status.
        """
        select_societies_query: str = (
            "SELECT "
            "s.society_id, s.society_legal_name, s.society_unique_code, "
            "s.registration_number, s.billing_address, s.city_name, s.state_name, "
            "s.gstin_number, s.rwa_contact_person_name, s.rwa_contact_phone_number, "
            "s.rwa_contact_email_address, s.subscribed_plan_id, s.max_gates_allowed, "
            "s.photo_retention_days, s.enable_walkin_approval, s.enable_preapproval_passcode, "
            "s.enable_visitor_photo, s.enable_leave_at_gate, s.enable_notice_board, "
            "s.license_status, s.subscription_start_date, s.subscription_expiry_date, "
            "s.created_at, "
            "p.plan_name, p.billing_cycle, p.base_price_inr, "
            "u.user_id AS bootstrap_admin_user_id, "
            "u.bootstrap_activation_token, "
            "u.is_bootstrap_pending "
            "FROM societies s "
            "JOIN subscription_plans p ON s.subscribed_plan_id = p.plan_id "
            "LEFT JOIN users u ON u.society_id = s.society_id AND u.user_role = 'SOCIETY_ADMIN' "
            "ORDER BY s.created_at DESC"
        )
        database_cursor.execute(select_societies_query)
        society_client_records: List[Dict[str, Any]] = database_cursor.fetchall()
        return society_client_records

    def get_society_by_id(
        self,
        database_cursor: DictCursor,
        society_id: int,
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single society by ID with plan and admin bootstrap info.
        """
        select_society_query: str = (
            "SELECT "
            "s.society_id, s.society_legal_name, s.society_unique_code, "
            "s.registration_number, s.billing_address, s.city_name, s.state_name, "
            "s.gstin_number, s.rwa_contact_person_name, s.rwa_contact_phone_number, "
            "s.rwa_contact_email_address, s.subscribed_plan_id, s.max_gates_allowed, "
            "s.photo_retention_days, s.enable_walkin_approval, s.enable_preapproval_passcode, "
            "s.enable_visitor_photo, s.enable_leave_at_gate, s.enable_notice_board, "
            "s.license_status, s.subscription_start_date, s.subscription_expiry_date, "
            "s.created_at, "
            "p.plan_name, "
            "u.bootstrap_activation_token, u.is_bootstrap_pending "
            "FROM societies s "
            "JOIN subscription_plans p ON s.subscribed_plan_id = p.plan_id "
            "LEFT JOIN users u ON u.society_id = s.society_id AND u.user_role = 'SOCIETY_ADMIN' "
            "WHERE s.society_id = %s"
        )
        database_cursor.execute(select_society_query, (society_id,))
        society_record: Optional[Dict[str, Any]] = database_cursor.fetchone()
        return society_record

    def check_society_unique_code_exists(
        self,
        database_cursor: DictCursor,
        society_unique_code: str,
    ) -> bool:
        """
        Checks whether a society unique code is already taken.
        """
        check_code_query: str = (
            "SELECT 1 FROM societies WHERE society_unique_code = %s"
        )
        database_cursor.execute(check_code_query, (society_unique_code,))
        return database_cursor.fetchone() is not None

    def insert_society_client(
        self,
        database_cursor: DictCursor,
        society_legal_name: str,
        society_unique_code: str,
        registration_number: Optional[str],
        billing_address: Optional[str],
        city_name: str,
        state_name: str,
        gstin_number: Optional[str],
        rwa_contact_person_name: str,
        rwa_contact_phone_number: str,
        rwa_contact_email_address: Optional[str],
        subscribed_plan_id: int,
        max_gates_allowed: int,
        photo_retention_days: int,
        enable_walkin_approval: bool,
        enable_preapproval_passcode: bool,
        enable_visitor_photo: bool,
        enable_leave_at_gate: bool,
        enable_notice_board: bool,
        license_status: str,
        subscription_start_date: str,
        subscription_expiry_date: str,
    ) -> int:
        """
        Inserts an onboarded society client inside an active ACID transaction.
        """
        insert_society_query: str = (
            "INSERT INTO societies ("
            "society_legal_name, society_unique_code, registration_number, "
            "billing_address, city_name, state_name, gstin_number, "
            "rwa_contact_person_name, rwa_contact_phone_number, rwa_contact_email_address, "
            "subscribed_plan_id, max_gates_allowed, photo_retention_days, "
            "enable_walkin_approval, enable_preapproval_passcode, enable_visitor_photo, "
            "enable_leave_at_gate, enable_notice_board, license_status, "
            "subscription_start_date, subscription_expiry_date"
            ") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        )
        database_cursor.execute(
            insert_society_query,
            (
                society_legal_name,
                society_unique_code,
                registration_number,
                billing_address,
                city_name,
                state_name,
                gstin_number,
                rwa_contact_person_name,
                rwa_contact_phone_number,
                rwa_contact_email_address,
                subscribed_plan_id,
                max_gates_allowed,
                photo_retention_days,
                enable_walkin_approval,
                enable_preapproval_passcode,
                enable_visitor_photo,
                enable_leave_at_gate,
                enable_notice_board,
                license_status,
                subscription_start_date,
                subscription_expiry_date,
            ),
        )
        return database_cursor.lastrowid

    def update_society_entitlements_and_license(
        self,
        database_cursor: DictCursor,
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
    ) -> int:
        """
        Updates entitlement feature flags, gates limit, photo retention, and license status.
        """
        update_society_query: str = (
            "UPDATE societies SET "
            "max_gates_allowed = %s, photo_retention_days = %s, "
            "enable_walkin_approval = %s, enable_preapproval_passcode = %s, "
            "enable_visitor_photo = %s, enable_leave_at_gate = %s, "
            "enable_notice_board = %s, license_status = %s, "
            "subscription_expiry_date = %s "
            "WHERE society_id = %s"
        )
        database_cursor.execute(
            update_society_query,
            (
                max_gates_allowed,
                photo_retention_days,
                enable_walkin_approval,
                enable_preapproval_passcode,
                enable_visitor_photo,
                enable_leave_at_gate,
                enable_notice_board,
                license_status,
                subscription_expiry_date,
                society_id,
            ),
        )
        return database_cursor.rowcount

    def insert_initial_society_admin_user(
        self,
        database_cursor: DictCursor,
        society_id: int,
        full_name: str,
        phone_number: str,
        bootstrap_activation_token: str,
    ) -> int:
        """
        Inserts the root SOCIETY_ADMIN record with is_bootstrap_pending = TRUE
        and a secure random bootstrap activation token.
        """
        # Temporary placeholder password hash until admin activates account
        temporary_password_hash: str = "BOOTSTRAP_PENDING_ACTIVATION"
        insert_user_query: str = (
            "INSERT INTO users ("
            "society_id, flat_id, full_name, phone_number, password_hash, "
            "user_role, resident_type, approval_status, bootstrap_activation_token, "
            "is_bootstrap_pending, is_active"
            ") VALUES (%s, NULL, %s, %s, %s, 'SOCIETY_ADMIN', NULL, 'APPROVED', %s, TRUE, TRUE)"
        )
        database_cursor.execute(
            insert_user_query,
            (
                society_id,
                full_name,
                phone_number,
                temporary_password_hash,
                bootstrap_activation_token,
            ),
        )
        return database_cursor.lastrowid

    # -------------------------------------------------------------------------
    # B2B INVOICES & BILLING
    # -------------------------------------------------------------------------

    def get_all_b2b_invoices(
        self,
        database_cursor: DictCursor,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all B2B invoices with society details.
        """
        select_invoices_query: str = (
            "SELECT "
            "i.invoice_id, i.society_id, i.invoice_number, i.base_amount_inr, "
            "i.gst_amount_inr, i.total_amount_inr, i.payment_status, "
            "i.billing_period_start, i.billing_period_end, i.created_at, "
            "s.society_legal_name, s.society_unique_code, s.gstin_number "
            "FROM b2b_invoices i "
            "JOIN societies s ON i.society_id = s.society_id "
            "ORDER BY i.created_at DESC"
        )
        database_cursor.execute(select_invoices_query)
        b2b_invoice_records: List[Dict[str, Any]] = database_cursor.fetchall()
        return b2b_invoice_records

    def insert_b2b_invoice(
        self,
        database_cursor: DictCursor,
        society_id: int,
        invoice_number: str,
        base_amount_inr: float,
        gst_amount_inr: float,
        total_amount_inr: float,
        payment_status: str,
        billing_period_start: str,
        billing_period_end: str,
    ) -> int:
        """
        Inserts a generated B2B invoice atomically inside an ACID transaction.
        """
        insert_invoice_query: str = (
            "INSERT INTO b2b_invoices ("
            "society_id, invoice_number, base_amount_inr, gst_amount_inr, "
            "total_amount_inr, payment_status, billing_period_start, billing_period_end"
            ") VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        )
        database_cursor.execute(
            insert_invoice_query,
            (
                society_id,
                invoice_number,
                base_amount_inr,
                gst_amount_inr,
                total_amount_inr,
                payment_status,
                billing_period_start,
                billing_period_end,
            ),
        )
        return database_cursor.lastrowid

    def update_invoice_payment_status(
        self,
        database_cursor: DictCursor,
        invoice_id: int,
        payment_status: str,
    ) -> int:
        """
        Updates payment status of an invoice (UNPAID -> PAID or CANCELLED).
        """
        update_invoice_query: str = (
            "UPDATE b2b_invoices SET payment_status = %s WHERE invoice_id = %s"
        )
        database_cursor.execute(update_invoice_query, (payment_status, invoice_id))
        return database_cursor.rowcount
