"""
Financial and Maintenance Billing Repository
Data Access Layer (Single Responsibility Principle) for Smart Nivas Accounts Receivable.
Follows SOLID principles: Pure parameterized SQL queries with zero business logic.
Strict tenant isolation by society_id on all operations.
"""

from typing import Any, Dict, List, Optional
from pymysql.cursors import DictCursor


class SocietyBillingRepository:
    """
    Encapsulates all database operations for Society Maintenance Billing,
    Invoices, Ledger, and Payment Receipts.
    """

    # =========================================================================
    # 1. Configuration Setup & Master Billing Heads
    # =========================================================================

    def get_billing_configuration(
        self, database_cursor: DictCursor, society_id: int
    ) -> Optional[Dict[str, Any]]:
        query = """
            SELECT
                config_id, society_id, calculation_mode, fixed_monthly_rate_inr,
                rate_per_sqft_inr, due_day_of_month, grace_period_days,
                penalty_type, penalty_amount_or_rate, beneficiary_name,
                bank_name, account_number, ifsc_code, upi_vpa,
                enable_gst, gst_rate_percent, gst_exemption_limit_inr, society_gstin,
                updated_at
            FROM society_billing_configurations
            WHERE society_id = %s
        """
        database_cursor.execute(query, (society_id,))
        return database_cursor.fetchone()

    def upsert_billing_configuration(
        self, database_cursor: DictCursor, society_id: int, config_data: Dict[str, Any]
    ) -> None:
        query = """
            INSERT INTO society_billing_configurations (
                society_id, calculation_mode, fixed_monthly_rate_inr,
                rate_per_sqft_inr, due_day_of_month, grace_period_days,
                penalty_type, penalty_amount_or_rate, beneficiary_name,
                bank_name, account_number, ifsc_code, upi_vpa,
                enable_gst, gst_rate_percent, gst_exemption_limit_inr, society_gstin
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                calculation_mode = VALUES(calculation_mode),
                fixed_monthly_rate_inr = VALUES(fixed_monthly_rate_inr),
                rate_per_sqft_inr = VALUES(rate_per_sqft_inr),
                due_day_of_month = VALUES(due_day_of_month),
                grace_period_days = VALUES(grace_period_days),
                penalty_type = VALUES(penalty_type),
                penalty_amount_or_rate = VALUES(penalty_amount_or_rate),
                beneficiary_name = VALUES(beneficiary_name),
                bank_name = VALUES(bank_name),
                account_number = VALUES(account_number),
                ifsc_code = VALUES(ifsc_code),
                upi_vpa = VALUES(upi_vpa),
                enable_gst = VALUES(enable_gst),
                gst_rate_percent = VALUES(gst_rate_percent),
                gst_exemption_limit_inr = VALUES(gst_exemption_limit_inr),
                society_gstin = VALUES(society_gstin)
        """
        database_cursor.execute(
            query,
            (
                society_id,
                config_data.get("calculation_mode", "FIXED_PER_FLAT"),
                config_data.get("fixed_monthly_rate_inr", 2000.00),
                config_data.get("rate_per_sqft_inr", 2.50),
                config_data.get("due_day_of_month", 10),
                config_data.get("grace_period_days", 5),
                config_data.get("penalty_type", "FLAT_FEE"),
                config_data.get("penalty_amount_or_rate", 500.00),
                config_data.get("beneficiary_name"),
                config_data.get("bank_name"),
                config_data.get("account_number"),
                config_data.get("ifsc_code"),
                config_data.get("upi_vpa"),
                bool(config_data.get("enable_gst", False)),
                config_data.get("gst_rate_percent", 18.00),
                config_data.get("gst_exemption_limit_inr", 7500.00),
                config_data.get("society_gstin"),
            ),
        )

    def list_billing_heads(
        self, database_cursor: DictCursor, society_id: int
    ) -> List[Dict[str, Any]]:
        query = """
            SELECT head_id, society_id, head_name, default_amount_inr, is_mandatory, is_active
            FROM society_billing_heads
            WHERE society_id = %s
            ORDER BY is_mandatory DESC, head_name ASC
        """
        database_cursor.execute(query, (society_id,))
        return database_cursor.fetchall()

    def create_billing_head(
        self,
        database_cursor: DictCursor,
        society_id: int,
        head_name: str,
        default_amount_inr: float,
        is_mandatory: bool = True,
    ) -> int:
        query = """
            INSERT INTO society_billing_heads (society_id, head_name, default_amount_inr, is_mandatory)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE default_amount_inr = VALUES(default_amount_inr), is_active = TRUE
        """
        database_cursor.execute(query, (society_id, head_name.strip(), default_amount_inr, is_mandatory))
        return database_cursor.lastrowid

    # =========================================================================
    # 2. Billing Dashboard Summary & Trends
    # =========================================================================

    def get_dashboard_summary(
        self, database_cursor: DictCursor, society_id: int
    ) -> Dict[str, Any]:
        """
        Aggregates total billed, total collected, and outstanding balances.
        """
        query_totals = """
            SELECT
                COALESCE(SUM(total_invoice_amount_inr), 0.00) AS total_billed_inr,
                COALESCE(SUM(paid_amount_inr), 0.00) AS total_collected_inr,
                COALESCE(SUM(outstanding_balance_inr), 0.00) AS total_outstanding_inr,
                COUNT(CASE WHEN payment_status = 'OVERDUE' OR (outstanding_balance_inr > 0 AND due_date < CURDATE()) THEN 1 END) AS defaulters_count,
                COUNT(invoice_id) AS total_invoices_issued
            FROM flat_invoices
            WHERE society_id = %s
        """
        database_cursor.execute(query_totals, (society_id,))
        totals = database_cursor.fetchone() or {}

        # Monthly breakdown for bar charts (last 6 months)
        query_monthly = """
            SELECT
                billing_period_month,
                billing_period_label,
                COALESCE(SUM(total_invoice_amount_inr), 0.00) AS billed_amount,
                COALESCE(SUM(paid_amount_inr), 0.00) AS collected_amount,
                COALESCE(SUM(outstanding_balance_inr), 0.00) AS outstanding_amount
            FROM flat_invoices
            WHERE society_id = %s
            GROUP BY billing_period_month, billing_period_label
            ORDER BY billing_period_month DESC
            LIMIT 6
        """
        database_cursor.execute(query_monthly, (society_id,))
        monthly_series = database_cursor.fetchall()
        monthly_series.reverse()  # chronological order for charts

        return {
            "total_billed_inr": float(totals.get("total_billed_inr", 0.0)),
            "total_collected_inr": float(totals.get("total_collected_inr", 0.0)),
            "total_outstanding_inr": float(totals.get("total_outstanding_inr", 0.0)),
            "defaulters_count": int(totals.get("defaulters_count", 0)),
            "total_invoices_issued": int(totals.get("total_invoices_issued", 0)),
            "monthly_trends": monthly_series,
        }

    # =========================================================================
    # 3. Invoice Generation & Management
    # =========================================================================

    def get_flats_for_billing(
        self, database_cursor: DictCursor, society_id: int
    ) -> List[Dict[str, Any]]:
        query = """
            SELECT
                f.flat_id, f.flat_number, f.floor_number, f.occupancy_status,
                f.super_builtup_area_sqft, w.wing_name,
                (SELECT full_name FROM users u WHERE u.flat_id = f.flat_id AND u.is_active = 1 ORDER BY u.resident_type = 'OWNER' DESC LIMIT 1) AS resident_name,
                (SELECT phone_number FROM users u WHERE u.flat_id = f.flat_id AND u.is_active = 1 ORDER BY u.resident_type = 'OWNER' DESC LIMIT 1) AS resident_phone
            FROM flats f
            JOIN wings w ON f.wing_id = w.wing_id
            WHERE f.society_id = %s
            ORDER BY w.wing_name ASC, f.flat_number ASC
        """
        database_cursor.execute(query, (society_id,))
        return database_cursor.fetchall()

    def check_invoices_exist_for_month(
        self, database_cursor: DictCursor, society_id: int, billing_period_month: str
    ) -> int:
        query = """
            SELECT COUNT(*) AS cnt FROM flat_invoices
            WHERE society_id = %s AND billing_period_month = %s
        """
        database_cursor.execute(query, (society_id, billing_period_month))
        row = database_cursor.fetchone()
        return row["cnt"] if row else 0

    def insert_flat_invoice(
        self,
        database_cursor: DictCursor,
        invoice_record: Dict[str, Any],
    ) -> int:
        query = """
            INSERT INTO flat_invoices (
                society_id, flat_id, invoice_number, billing_period_month,
                billing_period_label, issue_date, due_date,
                base_maintenance_amount_inr, additional_heads_amount_inr,
                penalty_amount_inr, taxable_amount_inr, gst_rate_percent, gst_amount_inr,
                total_invoice_amount_inr, paid_amount_inr, outstanding_balance_inr, payment_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0.00, %s, 'UNPAID')
        """
        database_cursor.execute(
            query,
            (
                invoice_record["society_id"],
                invoice_record["flat_id"],
                invoice_record["invoice_number"],
                invoice_record["billing_period_month"],
                invoice_record["billing_period_label"],
                invoice_record["issue_date"],
                invoice_record["due_date"],
                invoice_record["base_maintenance_amount_inr"],
                invoice_record["additional_heads_amount_inr"],
                invoice_record.get("penalty_amount_inr", 0.00),
                invoice_record.get("taxable_amount_inr", 0.00),
                invoice_record.get("gst_rate_percent", 0.00),
                invoice_record.get("gst_amount_inr", 0.00),
                invoice_record["total_invoice_amount_inr"],
                invoice_record["total_invoice_amount_inr"],
            ),
        )
        return database_cursor.lastrowid

    def insert_invoice_line_items(
        self,
        database_cursor: DictCursor,
        invoice_id: int,
        line_items: List[Dict[str, Any]],
    ) -> None:
        if not line_items:
            return
        query = """
            INSERT INTO flat_invoice_line_items (invoice_id, head_name, amount_inr)
            VALUES (%s, %s, %s)
        """
        params = [(invoice_id, item["head_name"], item["amount_inr"]) for item in line_items]
        database_cursor.executemany(query, params)

    # =========================================================================
    # 4. Flat-by-Flat Ledger & History
    # =========================================================================

    def get_society_flats_ledger_overview(
        self, database_cursor: DictCursor, society_id: int
    ) -> List[Dict[str, Any]]:
        """
        Returns grid of all flats with wing, area, resident details,
        total billed, total paid, and net balance.
        """
        query = """
            SELECT
                f.flat_id,
                f.flat_number,
                w.wing_name,
                f.super_builtup_area_sqft,
                f.occupancy_status,
                (SELECT full_name FROM users u WHERE u.flat_id = f.flat_id AND u.is_active = 1 ORDER BY u.resident_type = 'OWNER' DESC LIMIT 1) AS resident_name,
                (SELECT phone_number FROM users u WHERE u.flat_id = f.flat_id AND u.is_active = 1 ORDER BY u.resident_type = 'OWNER' DESC LIMIT 1) AS resident_phone,
                COALESCE(SUM(i.total_invoice_amount_inr), 0.00) AS total_billed_inr,
                COALESCE(SUM(i.paid_amount_inr), 0.00) AS total_paid_inr,
                COALESCE(SUM(i.outstanding_balance_inr), 0.00) AS current_outstanding_inr,
                COUNT(CASE WHEN i.payment_status = 'OVERDUE' OR (i.outstanding_balance_inr > 0 AND i.due_date < CURDATE()) THEN 1 END) AS overdue_invoices_count,
                (SELECT MAX(issue_date) FROM flat_invoices WHERE flat_id = f.flat_id) AS last_invoiced_date
            FROM flats f
            JOIN wings w ON f.wing_id = w.wing_id
            LEFT JOIN flat_invoices i ON f.flat_id = i.flat_id
            WHERE f.society_id = %s
            GROUP BY f.flat_id, f.flat_number, w.wing_name, f.super_builtup_area_sqft, f.occupancy_status
            ORDER BY w.wing_name ASC, f.flat_number ASC
        """
        database_cursor.execute(query, (society_id,))
        return database_cursor.fetchall()

    def get_flat_ledger_entries(
        self, database_cursor: DictCursor, society_id: int, flat_id: int
    ) -> List[Dict[str, Any]]:
        query = """
            SELECT entry_id, entry_date, entry_type, reference_id,
                   description, debit_amount_inr, credit_amount_inr,
                   running_balance_inr, created_at
            FROM flat_ledger_entries
            WHERE society_id = %s AND flat_id = %s
            ORDER BY entry_date ASC, entry_id ASC
        """
        database_cursor.execute(query, (society_id, flat_id))
        return database_cursor.fetchall()

    def get_flat_unpaid_invoices(
        self, database_cursor: DictCursor, society_id: int, flat_id: int
    ) -> List[Dict[str, Any]]:
        query = """
            SELECT invoice_id, invoice_number, billing_period_label, issue_date,
                   due_date, total_invoice_amount_inr, paid_amount_inr,
                   outstanding_balance_inr, payment_status
            FROM flat_invoices
            WHERE society_id = %s AND flat_id = %s AND outstanding_balance_inr > 0
            ORDER BY due_date ASC
        """
        database_cursor.execute(query, (society_id, flat_id))
        return database_cursor.fetchall()

    def get_invoice_by_id(
        self, database_cursor: DictCursor, society_id: int, invoice_id: int
    ) -> Optional[Dict[str, Any]]:
        query = """
            SELECT i.*, f.flat_number, w.wing_name,
                   (SELECT full_name FROM users u WHERE u.flat_id = f.flat_id AND u.is_active = 1 ORDER BY u.resident_type = 'OWNER' DESC LIMIT 1) AS resident_name,
                   (SELECT phone_number FROM users u WHERE u.flat_id = f.flat_id AND u.is_active = 1 ORDER BY u.resident_type = 'OWNER' DESC LIMIT 1) AS resident_phone
            FROM flat_invoices i
            JOIN flats f ON i.flat_id = f.flat_id
            JOIN wings w ON f.wing_id = w.wing_id
            WHERE i.society_id = %s AND i.invoice_id = %s
        """
        database_cursor.execute(query, (society_id, invoice_id))
        return database_cursor.fetchone()

    # =========================================================================
    # 5. Payment Recording & Reconciliation
    # =========================================================================

    def record_payment_receipt(
        self,
        database_cursor: DictCursor,
        payment_record: Dict[str, Any],
    ) -> int:
        query = """
            INSERT INTO flat_payments (
                society_id, flat_id, invoice_id, receipt_number,
                amount_paid_inr, payment_mode, transaction_reference,
                cheque_number, cheque_date, bank_name, deposit_slip_image_url,
                payment_date, notes, recorded_by_user_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        database_cursor.execute(
            query,
            (
                payment_record["society_id"],
                payment_record["flat_id"],
                payment_record.get("invoice_id"),
                payment_record["receipt_number"],
                payment_record["amount_paid_inr"],
                payment_record["payment_mode"],
                payment_record.get("transaction_reference"),
                payment_record.get("cheque_number"),
                payment_record.get("cheque_date"),
                payment_record.get("bank_name"),
                payment_record.get("deposit_slip_image_url"),
                payment_record["payment_date"],
                payment_record.get("notes"),
                payment_record.get("recorded_by_user_id"),
            ),
        )
        return database_cursor.lastrowid

    def update_invoice_payment_progress(
        self,
        database_cursor: DictCursor,
        invoice_id: int,
        additional_paid_inr: float,
    ) -> None:
        query = """
            UPDATE flat_invoices
            SET
                paid_amount_inr = paid_amount_inr + %s,
                outstanding_balance_inr = GREATEST(0.00, total_invoice_amount_inr - (paid_amount_inr + %s)),
                payment_status = CASE
                    WHEN (total_invoice_amount_inr - (paid_amount_inr + %s)) <= 0.00 THEN 'PAID'
                    ELSE 'PARTIALLY_PAID'
                END
            WHERE invoice_id = %s
        """
        database_cursor.execute(
            query,
            (additional_paid_inr, additional_paid_inr, additional_paid_inr, invoice_id),
        )

    def insert_ledger_entry(
        self,
        database_cursor: DictCursor,
        entry_data: Dict[str, Any],
    ) -> int:
        query = """
            INSERT INTO flat_ledger_entries (
                society_id, flat_id, entry_date, entry_type,
                reference_id, description, debit_amount_inr,
                credit_amount_inr, running_balance_inr
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        database_cursor.execute(
            query,
            (
                entry_data["society_id"],
                entry_data["flat_id"],
                entry_data["entry_date"],
                entry_data["entry_type"],
                entry_data["reference_id"],
                entry_data["description"],
                entry_data.get("debit_amount_inr", 0.00),
                entry_data.get("credit_amount_inr", 0.00),
                entry_data.get("running_balance_inr", 0.00),
            ),
        )
        return database_cursor.lastrowid

    # =========================================================================
    # 6. Advanced Financial Reports
    # =========================================================================

    def get_defaulters_aging_report(
        self, database_cursor: DictCursor, society_id: int, as_of_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Aging analysis classifying flat overdue balances into buckets:
        - Current (0-30 days overdue)
        - 31-60 days overdue
        - 61-90 days overdue
        - 90+ days overdue
        """
        ref_date = as_of_date if as_of_date else "CURDATE()"
        date_expr = "%s" if as_of_date else "CURDATE()"

        query = f"""
            SELECT
                f.flat_id,
                f.flat_number,
                w.wing_name,
                f.super_builtup_area_sqft,
                f.occupancy_status,
                (SELECT full_name FROM users u WHERE u.flat_id = f.flat_id AND u.is_active = 1 ORDER BY u.resident_type = 'OWNER' DESC LIMIT 1) AS resident_name,
                (SELECT phone_number FROM users u WHERE u.flat_id = f.flat_id AND u.is_active = 1 ORDER BY u.resident_type = 'OWNER' DESC LIMIT 1) AS resident_phone,
                COUNT(i.invoice_id) AS unpaid_invoices_count,
                MIN(i.due_date) AS oldest_due_date,
                MAX(DATEDIFF({date_expr}, i.due_date)) AS max_days_overdue,
                COALESCE(SUM(CASE WHEN DATEDIFF({date_expr}, i.due_date) <= 30 THEN i.outstanding_balance_inr ELSE 0 END), 0.00) AS bucket_0_to_30_inr,
                COALESCE(SUM(CASE WHEN DATEDIFF({date_expr}, i.due_date) BETWEEN 31 AND 60 THEN i.outstanding_balance_inr ELSE 0 END), 0.00) AS bucket_31_to_60_inr,
                COALESCE(SUM(CASE WHEN DATEDIFF({date_expr}, i.due_date) BETWEEN 61 AND 90 THEN i.outstanding_balance_inr ELSE 0 END), 0.00) AS bucket_61_to_90_inr,
                COALESCE(SUM(CASE WHEN DATEDIFF({date_expr}, i.due_date) > 90 THEN i.outstanding_balance_inr ELSE 0 END), 0.00) AS bucket_90_plus_inr,
                COALESCE(SUM(i.outstanding_balance_inr), 0.00) AS total_overdue_balance_inr
            FROM flats f
            JOIN wings w ON f.wing_id = w.wing_id
            JOIN flat_invoices i ON f.flat_id = i.flat_id
            WHERE f.society_id = %s
              AND i.outstanding_balance_inr > 0
              AND i.due_date < {date_expr}
            GROUP BY f.flat_id, f.flat_number, w.wing_name, f.super_builtup_area_sqft, f.occupancy_status
            ORDER BY total_overdue_balance_inr DESC, max_days_overdue DESC
        """
        params = [ref_date, ref_date, ref_date, ref_date, ref_date, society_id, ref_date] if as_of_date else [society_id]
        database_cursor.execute(query, tuple(params))
        return database_cursor.fetchall()

    def get_collection_report(
        self,
        database_cursor: DictCursor,
        society_id: int,
        start_date: str,
        end_date: str,
        group_by: str = "DAILY",  # "DAILY" or "MONTHLY"
    ) -> Dict[str, Any]:
        """
        Payment collection report split by payment mode (UPI, Cash, Cheque, NEFT/IMPS).
        """
        date_format = "%%Y-%%m-%%d" if group_by == "DAILY" else "%%Y-%%m"

        query_breakdown = f"""
            SELECT
                DATE_FORMAT(p.payment_date, '{date_format}') AS period_key,
                COALESCE(SUM(p.amount_paid_inr), 0.00) AS total_collected_inr,
                COALESCE(SUM(CASE WHEN p.payment_mode = 'UPI' THEN p.amount_paid_inr ELSE 0 END), 0.00) AS upi_amount_inr,
                COALESCE(SUM(CASE WHEN p.payment_mode = 'CASH' THEN p.amount_paid_inr ELSE 0 END), 0.00) AS cash_amount_inr,
                COALESCE(SUM(CASE WHEN p.payment_mode = 'CHEQUE' THEN p.amount_paid_inr ELSE 0 END), 0.00) AS cheque_amount_inr,
                COALESCE(SUM(CASE WHEN p.payment_mode = 'NEFT_IMPS' THEN p.amount_paid_inr ELSE 0 END), 0.00) AS neft_amount_inr,
                COUNT(p.payment_id) AS transactions_count
            FROM flat_payments p
            WHERE p.society_id = %s
              AND p.payment_date BETWEEN %s AND %s
            GROUP BY period_key
            ORDER BY period_key DESC
        """
        database_cursor.execute(query_breakdown, (society_id, start_date, end_date))
        breakdown_rows = database_cursor.fetchall()

        # Detailed receipts log for this period
        query_receipts = """
            SELECT
                p.payment_id,
                p.receipt_number,
                p.payment_date,
                p.amount_paid_inr,
                p.payment_mode,
                p.transaction_reference,
                p.cheque_number,
                p.cheque_date,
                p.bank_name,
                p.notes,
                f.flat_number,
                w.wing_name,
                (SELECT full_name FROM users u WHERE u.flat_id = f.flat_id AND u.is_active = 1 ORDER BY u.resident_type = 'OWNER' DESC LIMIT 1) AS resident_name,
                i.invoice_number,
                i.billing_period_label
            FROM flat_payments p
            JOIN flats f ON p.flat_id = f.flat_id
            JOIN wings w ON f.wing_id = w.wing_id
            LEFT JOIN flat_invoices i ON p.invoice_id = i.invoice_id
            WHERE p.society_id = %s
              AND p.payment_date BETWEEN %s AND %s
            ORDER BY p.payment_date DESC, p.payment_id DESC
        """
        database_cursor.execute(query_receipts, (society_id, start_date, end_date))
        receipts_log = database_cursor.fetchall()

        # Overall summary by mode
        total_collected = sum(float(r["total_collected_inr"]) for r in breakdown_rows)
        total_upi = sum(float(r["upi_amount_inr"]) for r in breakdown_rows)
        total_cash = sum(float(r["cash_amount_inr"]) for r in breakdown_rows)
        total_cheque = sum(float(r["cheque_amount_inr"]) for r in breakdown_rows)
        total_neft = sum(float(r["neft_amount_inr"]) for r in breakdown_rows)
        total_txns = sum(int(r["transactions_count"]) for r in breakdown_rows)

        return {
            "start_date": start_date,
            "end_date": end_date,
            "group_by": group_by,
            "summary": {
                "total_collected_inr": total_collected,
                "total_upi_inr": total_upi,
                "total_cash_inr": total_cash,
                "total_cheque_inr": total_cheque,
                "total_neft_inr": total_neft,
                "total_transactions_count": total_txns,
            },
            "timeline": breakdown_rows,
            "receipts": receipts_log,
        }

    def get_tax_gst_output_report(
        self,
        database_cursor: DictCursor,
        society_id: int,
        start_date: str,
        end_date: str,
    ) -> Dict[str, Any]:
        """
        Generates Tax/GST Output filing statement:
        - Total taxable value
        - CGST (9%) + SGST (9%) or IGST (18%) split
        - Exempt vs Taxable maintenance breakdown
        - Invoice-level GST register for GSTR-1 / CA filing
        """
        # Load society GSTIN
        query_soc = """
            SELECT s.society_legal_name, s.gstin_number,
                   c.enable_gst, c.gst_rate_percent, c.gst_exemption_limit_inr, c.society_gstin
            FROM societies s
            LEFT JOIN society_billing_configurations c ON s.society_id = c.society_id
            WHERE s.society_id = %s
        """
        database_cursor.execute(query_soc, (society_id,))
        soc_info = database_cursor.fetchone() or {}

        # Monthly summary of GST output
        query_monthly_gst = """
            SELECT
                i.billing_period_month,
                i.billing_period_label,
                COUNT(i.invoice_id) AS total_invoices_issued,
                COALESCE(SUM(i.taxable_amount_inr), 0.00) AS total_taxable_amount_inr,
                COALESCE(SUM(CASE WHEN i.gst_amount_inr = 0.00 THEN i.total_invoice_amount_inr ELSE 0 END), 0.00) AS exempt_amount_inr,
                COALESCE(SUM(i.gst_amount_inr), 0.00) AS total_gst_collected_inr,
                COALESCE(SUM(i.gst_amount_inr / 2.0), 0.00) AS cgst_collected_inr,
                COALESCE(SUM(i.gst_amount_inr / 2.0), 0.00) AS sgst_collected_inr,
                COALESCE(SUM(i.total_invoice_amount_inr), 0.00) AS gross_invoiced_inr
            FROM flat_invoices i
            WHERE i.society_id = %s
              AND i.issue_date BETWEEN %s AND %s
            GROUP BY i.billing_period_month, i.billing_period_label
            ORDER BY i.billing_period_month DESC
        """
        database_cursor.execute(query_monthly_gst, (society_id, start_date, end_date))
        monthly_tax_summary = database_cursor.fetchall()

        # Detailed itemized invoice tax register
        query_register = """
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.issue_date,
                i.due_date,
                f.flat_number,
                w.wing_name,
                (SELECT full_name FROM users u WHERE u.flat_id = f.flat_id AND u.is_active = 1 ORDER BY u.resident_type = 'OWNER' DESC LIMIT 1) AS resident_name,
                i.taxable_amount_inr,
                i.gst_rate_percent,
                i.gst_amount_inr,
                ROUND(i.gst_amount_inr / 2.0, 2) AS cgst_inr,
                ROUND(i.gst_amount_inr / 2.0, 2) AS sgst_inr,
                i.total_invoice_amount_inr,
                i.paid_amount_inr,
                i.outstanding_balance_inr,
                i.payment_status
            FROM flat_invoices i
            JOIN flats f ON i.flat_id = f.flat_id
            JOIN wings w ON f.wing_id = w.wing_id
            WHERE i.society_id = %s
              AND i.issue_date BETWEEN %s AND %s
            ORDER BY i.issue_date DESC, i.invoice_number ASC
        """
        database_cursor.execute(query_register, (society_id, start_date, end_date))
        invoices_register = database_cursor.fetchall()

        tot_taxable = sum(float(r["total_taxable_amount_inr"]) for r in monthly_tax_summary)
        tot_exempt = sum(float(r["exempt_amount_inr"]) for r in monthly_tax_summary)
        tot_gst = sum(float(r["total_gst_collected_inr"]) for r in monthly_tax_summary)
        tot_cgst = sum(float(r["cgst_collected_inr"]) for r in monthly_tax_summary)
        tot_sgst = sum(float(r["sgst_collected_inr"]) for r in monthly_tax_summary)
        tot_gross = sum(float(r["gross_invoiced_inr"]) for r in monthly_tax_summary)

        return {
            "start_date": start_date,
            "end_date": end_date,
            "society": {
                "society_legal_name": soc_info.get("society_legal_name"),
                "gstin": soc_info.get("society_gstin") or soc_info.get("gstin_number") or "NOT_CONFIGURED",
                "enable_gst": bool(soc_info.get("enable_gst", False)),
                "default_gst_rate": float(soc_info.get("gst_rate_percent", 18.00)),
                "exemption_limit_inr": float(soc_info.get("gst_exemption_limit_inr", 7500.00)),
            },
            "summary": {
                "total_taxable_inr": tot_taxable,
                "total_exempt_inr": tot_exempt,
                "total_gst_inr": tot_gst,
                "total_cgst_inr": tot_cgst,
                "total_sgst_inr": tot_sgst,
                "total_gross_invoiced_inr": tot_gross,
                "total_invoices_count": len(invoices_register),
            },
            "monthly_summary": monthly_tax_summary,
            "invoice_register": invoices_register,
        }

