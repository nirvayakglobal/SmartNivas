"""
Smart Nivas - Society Accounts Payable & Expense Repository
Data access layer for Expense heads, TDS rules, Vendors, AMC contracts, Expense vouchers, and Reports.
Strictly follows SKILL.md: Parameterized SQL, zero single-letter variables, descriptive identifiers.
"""

from typing import List, Dict, Any, Optional

class SocietyAccountsPayableRepository:
    """Handles database interactions for Accounts Payable & Expense Management."""

    def __init__(self, database_cursor):
        self.database_cursor = database_cursor

    # =========================================================================
    # 1. CHART OF ACCOUNTS (EXPENSE HEADS)
    # =========================================================================

    def fetch_expense_heads(self, society_id: int, only_active: bool = False) -> List[Dict[str, Any]]:
        query_string = """
            SELECT 
                expense_head_id,
                society_id,
                category_code,
                head_name,
                description,
                is_active,
                created_at,
                updated_at
            FROM society_expense_heads
            WHERE society_id = %s
        """
        query_parameters = [society_id]
        if only_active:
            query_string += " AND is_active = TRUE"
        query_string += " ORDER BY category_code ASC, head_name ASC"

        self.database_cursor.execute(query_string, query_parameters)
        return self.database_cursor.fetchall()

    def create_expense_head(
        self,
        society_id: int,
        category_code: str,
        head_name: str,
        description: Optional[str] = None
    ) -> int:
        query_string = """
            INSERT INTO society_expense_heads (society_id, category_code, head_name, description, is_active)
            VALUES (%s, %s, %s, %s, TRUE)
        """
        self.database_cursor.execute(query_string, (society_id, category_code, head_name, description))
        return self.database_cursor.lastrowid

    def update_expense_head(
        self,
        expense_head_id: int,
        society_id: int,
        category_code: str,
        head_name: str,
        description: Optional[str],
        is_active: bool
    ) -> None:
        query_string = """
            UPDATE society_expense_heads
            SET category_code = %s,
                head_name = %s,
                description = %s,
                is_active = %s
            WHERE expense_head_id = %s AND society_id = %s
        """
        self.database_cursor.execute(
            query_string,
            (category_code, head_name, description, is_active, expense_head_id, society_id)
        )

    # =========================================================================
    # 2. TDS TAX RATES CONFIGURATION
    # =========================================================================

    def fetch_tds_configurations(self, society_id: int, only_active: bool = False) -> List[Dict[str, Any]]:
        query_string = """
            SELECT 
                tds_config_id,
                society_id,
                section_code,
                vendor_type,
                tds_percentage,
                threshold_limit_inr,
                is_active,
                created_at
            FROM society_tds_tax_configurations
            WHERE society_id = %s
        """
        query_parameters = [society_id]
        if only_active:
            query_string += " AND is_active = TRUE"
        query_string += " ORDER BY tds_percentage ASC"

        self.database_cursor.execute(query_string, query_parameters)
        return self.database_cursor.fetchall()

    def create_tds_configuration(
        self,
        society_id: int,
        section_code: str,
        vendor_type: str,
        tds_percentage: float,
        threshold_limit_inr: float
    ) -> int:
        query_string = """
            INSERT INTO society_tds_tax_configurations 
            (society_id, section_code, vendor_type, tds_percentage, threshold_limit_inr, is_active)
            VALUES (%s, %s, %s, %s, %s, TRUE)
        """
        self.database_cursor.execute(
            query_string,
            (society_id, section_code, vendor_type, tds_percentage, threshold_limit_inr)
        )
        return self.database_cursor.lastrowid

    def update_tds_configuration(
        self,
        tds_config_id: int,
        society_id: int,
        section_code: str,
        vendor_type: str,
        tds_percentage: float,
        threshold_limit_inr: float,
        is_active: bool
    ) -> None:
        query_string = """
            UPDATE society_tds_tax_configurations
            SET section_code = %s,
                vendor_type = %s,
                tds_percentage = %s,
                threshold_limit_inr = %s,
                is_active = %s
            WHERE tds_config_id = %s AND society_id = %s
        """
        self.database_cursor.execute(
            query_string,
            (section_code, vendor_type, tds_percentage, threshold_limit_inr, is_active, tds_config_id, society_id)
        )

    # =========================================================================
    # 3. VENDOR DIRECTORY
    # =========================================================================

    def fetch_vendors(self, society_id: int, only_active: bool = False) -> List[Dict[str, Any]]:
        query_string = """
            SELECT 
                vendor_record.vendor_id,
                vendor_record.society_id,
                vendor_record.vendor_name,
                vendor_record.contact_person,
                vendor_record.contact_phone,
                vendor_record.contact_email,
                vendor_record.vendor_type,
                vendor_record.gstin,
                vendor_record.pan_number,
                vendor_record.default_tds_config_id,
                tds_config.section_code AS default_tds_section_code,
                tds_config.tds_percentage AS default_tds_percentage,
                vendor_record.bank_name,
                vendor_record.bank_account_number,
                vendor_record.bank_ifsc_code,
                vendor_record.upi_id,
                vendor_record.service_description,
                vendor_record.is_active,
                vendor_record.created_at,
                vendor_record.updated_at
            FROM society_vendors vendor_record
            LEFT JOIN society_tds_tax_configurations tds_config 
                ON vendor_record.default_tds_config_id = tds_config.tds_config_id
            WHERE vendor_record.society_id = %s
        """
        query_parameters = [society_id]
        if only_active:
            query_string += " AND vendor_record.is_active = TRUE"
        query_string += " ORDER BY vendor_record.vendor_name ASC"

        self.database_cursor.execute(query_string, query_parameters)
        return self.database_cursor.fetchall()

    def fetch_vendor_by_id(self, vendor_id: int, society_id: int) -> Optional[Dict[str, Any]]:
        query_string = """
            SELECT 
                vendor_record.vendor_id,
                vendor_record.society_id,
                vendor_record.vendor_name,
                vendor_record.contact_person,
                vendor_record.contact_phone,
                vendor_record.contact_email,
                vendor_record.vendor_type,
                vendor_record.gstin,
                vendor_record.pan_number,
                vendor_record.default_tds_config_id,
                tds_config.section_code AS default_tds_section_code,
                tds_config.tds_percentage AS default_tds_percentage,
                vendor_record.bank_name,
                vendor_record.bank_account_number,
                vendor_record.bank_ifsc_code,
                vendor_record.upi_id,
                vendor_record.service_description,
                vendor_record.is_active,
                vendor_record.created_at,
                vendor_record.updated_at
            FROM society_vendors vendor_record
            LEFT JOIN society_tds_tax_configurations tds_config 
                ON vendor_record.default_tds_config_id = tds_config.tds_config_id
            WHERE vendor_record.vendor_id = %s AND vendor_record.society_id = %s
        """
        self.database_cursor.execute(query_string, (vendor_id, society_id))
        return self.database_cursor.fetchone()

    def create_vendor(
        self,
        society_id: int,
        vendor_name: str,
        contact_person: Optional[str],
        contact_phone: str,
        contact_email: Optional[str],
        vendor_type: str,
        gstin: Optional[str],
        pan_number: Optional[str],
        default_tds_config_id: Optional[int],
        bank_name: Optional[str],
        bank_account_number: Optional[str],
        bank_ifsc_code: Optional[str],
        upi_id: Optional[str],
        service_description: Optional[str]
    ) -> int:
        query_string = """
            INSERT INTO society_vendors (
                society_id, vendor_name, contact_person, contact_phone, contact_email,
                vendor_type, gstin, pan_number, default_tds_config_id,
                bank_name, bank_account_number, bank_ifsc_code, upi_id, service_description, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        """
        self.database_cursor.execute(
            query_string,
            (
                society_id, vendor_name, contact_person, contact_phone, contact_email,
                vendor_type, gstin, pan_number, default_tds_config_id,
                bank_name, bank_account_number, bank_ifsc_code, upi_id, service_description
            )
        )
        return self.database_cursor.lastrowid

    def update_vendor(
        self,
        vendor_id: int,
        society_id: int,
        vendor_name: str,
        contact_person: Optional[str],
        contact_phone: str,
        contact_email: Optional[str],
        vendor_type: str,
        gstin: Optional[str],
        pan_number: Optional[str],
        default_tds_config_id: Optional[int],
        bank_name: Optional[str],
        bank_account_number: Optional[str],
        bank_ifsc_code: Optional[str],
        upi_id: Optional[str],
        service_description: Optional[str],
        is_active: bool
    ) -> None:
        query_string = """
            UPDATE society_vendors
            SET vendor_name = %s,
                contact_person = %s,
                contact_phone = %s,
                contact_email = %s,
                vendor_type = %s,
                gstin = %s,
                pan_number = %s,
                default_tds_config_id = %s,
                bank_name = %s,
                bank_account_number = %s,
                bank_ifsc_code = %s,
                upi_id = %s,
                service_description = %s,
                is_active = %s
            WHERE vendor_id = %s AND society_id = %s
        """
        self.database_cursor.execute(
            query_string,
            (
                vendor_name, contact_person, contact_phone, contact_email,
                vendor_type, gstin, pan_number, default_tds_config_id,
                bank_name, bank_account_number, bank_ifsc_code, upi_id, service_description,
                is_active, vendor_id, society_id
            )
        )

    # =========================================================================
    # 4. ANNUAL MAINTENANCE CONTRACTS (AMC TRACKER)
    # =========================================================================

    def fetch_amc_contracts(self, society_id: int) -> List[Dict[str, Any]]:
        query_string = """
            SELECT 
                amc.amc_id,
                amc.society_id,
                amc.vendor_id,
                vendor.vendor_name,
                vendor.contact_phone AS vendor_phone,
                amc.expense_head_id,
                head.head_name AS expense_head_name,
                amc.contract_title,
                amc.start_date,
                amc.end_date,
                amc.contract_value_inr,
                amc.billing_frequency,
                amc.contract_document_url,
                amc.notes,
                amc.status,
                DATEDIFF(amc.end_date, CURDATE()) AS days_remaining,
                CASE 
                    WHEN amc.status != 'ACTIVE' THEN 'TERMINATED'
                    WHEN CURDATE() > amc.end_date THEN 'EXPIRED'
                    WHEN DATEDIFF(amc.end_date, CURDATE()) <= 30 THEN 'EXPIRING_SOON'
                    ELSE 'ACTIVE'
                END AS calculated_health_status,
                amc.created_at,
                amc.updated_at
            FROM society_amc_contracts amc
            INNER JOIN society_vendors vendor ON amc.vendor_id = vendor.vendor_id
            INNER JOIN society_expense_heads head ON amc.expense_head_id = head.expense_head_id
            WHERE amc.society_id = %s
            ORDER BY amc.end_date ASC
        """
        self.database_cursor.execute(query_string, (society_id,))
        return self.database_cursor.fetchall()

    def create_amc_contract(
        self,
        society_id: int,
        vendor_id: int,
        expense_head_id: int,
        contract_title: str,
        start_date: str,
        end_date: str,
        contract_value_inr: float,
        billing_frequency: str,
        contract_document_url: Optional[str] = None,
        notes: Optional[str] = None
    ) -> int:
        query_string = """
            INSERT INTO society_amc_contracts (
                society_id, vendor_id, expense_head_id, contract_title,
                start_date, end_date, contract_value_inr, billing_frequency,
                contract_document_url, notes, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'ACTIVE')
        """
        self.database_cursor.execute(
            query_string,
            (
                society_id, vendor_id, expense_head_id, contract_title,
                start_date, end_date, contract_value_inr, billing_frequency,
                contract_document_url, notes
            )
        )
        return self.database_cursor.lastrowid

    def update_amc_contract(
        self,
        amc_id: int,
        society_id: int,
        vendor_id: int,
        expense_head_id: int,
        contract_title: str,
        start_date: str,
        end_date: str,
        contract_value_inr: float,
        billing_frequency: str,
        contract_document_url: Optional[str],
        notes: Optional[str],
        status: str
    ) -> None:
        query_string = """
            UPDATE society_amc_contracts
            SET vendor_id = %s,
                expense_head_id = %s,
                contract_title = %s,
                start_date = %s,
                end_date = %s,
                contract_value_inr = %s,
                billing_frequency = %s,
                contract_document_url = %s,
                notes = %s,
                status = %s
            WHERE amc_id = %s AND society_id = %s
        """
        self.database_cursor.execute(
            query_string,
            (
                vendor_id, expense_head_id, contract_title,
                start_date, end_date, contract_value_inr, billing_frequency,
                contract_document_url, notes, status, amc_id, society_id
            )
        )

    # =========================================================================
    # 5. EXPENSE VOUCHER JOURNAL & AUDIT TRAIL
    # =========================================================================

    def generate_next_voucher_number(self, society_id: int, voucher_date: str) -> str:
        date_prefix = voucher_date.replace("-", "")[:6] # YYYYMM
        query_string = """
            SELECT COUNT(*) AS voucher_count
            FROM society_expense_vouchers
            WHERE society_id = %s AND voucher_number LIKE %s
            FOR UPDATE
        """
        search_pattern = f"VCH-{date_prefix}-%"
        self.database_cursor.execute(query_string, (society_id, search_pattern))
        count_record = self.database_cursor.fetchone()
        next_sequence_number = (count_record["voucher_count"] if count_record else 0) + 1
        return f"VCH-{date_prefix}-{next_sequence_number:04d}"

    def create_expense_voucher(
        self,
        society_id: int,
        voucher_number: str,
        voucher_date: str,
        vendor_id: Optional[int],
        expense_head_id: int,
        amc_id: Optional[int],
        gross_amount_inr: float,
        tds_percentage: float,
        tds_deducted_amount_inr: float,
        net_payable_amount_inr: float,
        payment_mode: str,
        payment_reference_number: Optional[str],
        payment_date: str,
        invoice_bill_number: Optional[str],
        invoice_attachment_url: Optional[str],
        invoice_attachment_filename: Optional[str],
        payment_status: str,
        remarks: Optional[str],
        recorded_by_user_id: Optional[int]
    ) -> int:
        query_string = """
            INSERT INTO society_expense_vouchers (
                society_id, voucher_number, voucher_date, vendor_id, expense_head_id, amc_id,
                gross_amount_inr, tds_percentage, tds_deducted_amount_inr, net_payable_amount_inr,
                payment_mode, payment_reference_number, payment_date,
                invoice_bill_number, invoice_attachment_url, invoice_attachment_filename,
                payment_status, remarks, recorded_by_user_id
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s
            )
        """
        self.database_cursor.execute(
            query_string,
            (
                society_id, voucher_number, voucher_date, vendor_id, expense_head_id, amc_id,
                gross_amount_inr, tds_percentage, tds_deducted_amount_inr, net_payable_amount_inr,
                payment_mode, payment_reference_number, payment_date,
                invoice_bill_number, invoice_attachment_url, invoice_attachment_filename,
                payment_status, remarks, recorded_by_user_id
            )
        )
        return self.database_cursor.lastrowid

    def fetch_expense_vouchers(
        self,
        society_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        vendor_id: Optional[int] = None,
        expense_head_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        query_string = """
            SELECT 
                voucher.voucher_id,
                voucher.society_id,
                voucher.voucher_number,
                voucher.voucher_date,
                voucher.vendor_id,
                vendor.vendor_name,
                vendor.gstin AS vendor_gstin,
                voucher.expense_head_id,
                head.head_name AS expense_head_name,
                head.category_code AS expense_head_category,
                voucher.amc_id,
                amc.contract_title AS amc_title,
                voucher.gross_amount_inr,
                voucher.tds_percentage,
                voucher.tds_deducted_amount_inr,
                voucher.net_payable_amount_inr,
                voucher.payment_mode,
                voucher.payment_reference_number,
                voucher.payment_date,
                voucher.invoice_bill_number,
                voucher.invoice_attachment_url,
                voucher.invoice_attachment_filename,
                voucher.payment_status,
                voucher.remarks,
                voucher.created_at
            FROM society_expense_vouchers voucher
            LEFT JOIN society_vendors vendor ON voucher.vendor_id = vendor.vendor_id
            INNER JOIN society_expense_heads head ON voucher.expense_head_id = head.expense_head_id
            LEFT JOIN society_amc_contracts amc ON voucher.amc_id = amc.amc_id
            WHERE voucher.society_id = %s
        """
        query_parameters = [society_id]

        if start_date:
            query_string += " AND voucher.voucher_date >= %s"
            query_parameters.append(start_date)
        if end_date:
            query_string += " AND voucher.voucher_date <= %s"
            query_parameters.append(end_date)
        if vendor_id:
            query_string += " AND voucher.vendor_id = %s"
            query_parameters.append(vendor_id)
        if expense_head_id:
            query_string += " AND voucher.expense_head_id = %s"
            query_parameters.append(expense_head_id)

        query_string += " ORDER BY voucher.voucher_date DESC, voucher.voucher_id DESC"

        self.database_cursor.execute(query_string, query_parameters)
        return self.database_cursor.fetchall()

    # =========================================================================
    # 6. REPORTS: P&L, CASHBOOK / LEDGER, VENDOR PAYOUT
    # =========================================================================

    def fetch_profit_and_loss_report(
        self,
        society_id: int,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """
        Aggregates maintenance receipts and billed revenue against operational expenses.
        """
        # 1. Total Maintenance Revenue (Paid Invoices / Collections)
        revenue_query = """
            SELECT 
                COALESCE(SUM(paid_amount_inr), 0.00) AS total_maintenance_collected,
                COALESCE(SUM(total_invoice_amount_inr), 0.00) AS total_maintenance_billed
            FROM flat_invoices
            WHERE society_id = %s
              AND issue_date >= %s
              AND issue_date <= %s
        """
        self.database_cursor.execute(revenue_query, (society_id, start_date, end_date))
        revenue_record = self.database_cursor.fetchone() or {
            "total_maintenance_collected": 0.00,
            "total_maintenance_billed": 0.00
        }

        # 2. Categorized Expenses Breakdown
        expense_query = """
            SELECT 
                head.category_code,
                head.head_name,
                COUNT(voucher.voucher_id) AS voucher_count,
                COALESCE(SUM(voucher.gross_amount_inr), 0.00) AS total_gross_expense,
                COALESCE(SUM(voucher.tds_deducted_amount_inr), 0.00) AS total_tds_deducted,
                COALESCE(SUM(voucher.net_payable_amount_inr), 0.00) AS total_net_disbursed
            FROM society_expense_vouchers voucher
            INNER JOIN society_expense_heads head ON voucher.expense_head_id = head.expense_head_id
            WHERE voucher.society_id = %s
              AND voucher.voucher_date >= %s
              AND voucher.voucher_date <= %s
              AND voucher.payment_status != 'CANCELLED'
            GROUP BY head.category_code, head.head_name
            ORDER BY total_gross_expense DESC
        """
        self.database_cursor.execute(expense_query, (society_id, start_date, end_date))
        categorized_expense_records = self.database_cursor.fetchall()

        total_gross_expense = sum(
            float(expense_row["total_gross_expense"]) 
            for expense_row in categorized_expense_records
        )
        total_tds_withheld = sum(
            float(expense_row["total_tds_deducted"]) 
            for expense_row in categorized_expense_records
        )
        total_net_disbursed = sum(
            float(expense_row["total_net_disbursed"]) 
            for expense_row in categorized_expense_records
        )

        total_income_collected = float(revenue_record["total_maintenance_collected"])
        net_surplus_or_deficit = total_income_collected - total_gross_expense

        return {
            "start_date": start_date,
            "end_date": end_date,
            "total_income_collected": total_income_collected,
            "total_income_billed": float(revenue_record["total_maintenance_billed"]),
            "total_gross_expense": total_gross_expense,
            "total_tds_withheld": total_tds_withheld,
            "total_net_disbursed": total_net_disbursed,
            "net_surplus_or_deficit": net_surplus_or_deficit,
            "is_surplus": net_surplus_or_deficit >= 0,
            "categorized_expenses": categorized_expense_records
        }

    def fetch_cashbook_ledger_records(
        self,
        society_id: int,
        start_date: str,
        end_date: str
    ) -> List[Dict[str, Any]]:
        """
        Unifies Flat Payment Receipts (INFLOW) and Expense Vouchers (OUTFLOW) in chronological order.
        """
        unified_query = """
            -- INFLOWS (Flat Maintenance Collections)
            SELECT 
                payment.payment_date AS transaction_date,
                payment.transaction_reference AS reference_number,
                payment.payment_mode AS transaction_mode,
                'INFLOW_RECEIPT' AS transaction_type,
                CONCAT('Maintenance Receipt: ', wing.wing_name, '-', flat.flat_number, ' (', COALESCE(invoice.billing_period_label, 'Payment'), ')') AS transaction_particulars,
                payment.amount_paid_inr AS credit_inflow_inr,
                0.00 AS debit_outflow_inr,
                payment.receipt_number AS document_identifier
            FROM flat_payments payment
            LEFT JOIN flat_invoices invoice ON payment.invoice_id = invoice.invoice_id
            INNER JOIN flats flat ON payment.flat_id = flat.flat_id
            INNER JOIN wings wing ON flat.wing_id = wing.wing_id
            WHERE payment.society_id = %s
              AND payment.payment_date >= %s
              AND payment.payment_date <= %s

            UNION ALL

            -- OUTFLOWS (Expense Vouchers Paid)
            SELECT 
                voucher.payment_date AS transaction_date,
                voucher.payment_reference_number AS reference_number,
                voucher.payment_mode AS transaction_mode,
                'OUTFLOW_EXPENSE' AS transaction_type,
                CONCAT('Expense: ', head.head_name, ' (Paid to ', COALESCE(vendor.vendor_name, 'Direct'), ')') AS transaction_particulars,
                0.00 AS credit_inflow_inr,
                voucher.net_payable_amount_inr AS debit_outflow_inr,
                voucher.voucher_number AS document_identifier
            FROM society_expense_vouchers voucher
            INNER JOIN society_expense_heads head ON voucher.expense_head_id = head.expense_head_id
            LEFT JOIN society_vendors vendor ON voucher.vendor_id = vendor.vendor_id
            WHERE voucher.society_id = %s
              AND voucher.payment_date >= %s
              AND voucher.payment_date <= %s
              AND voucher.payment_status = 'PAID'

            ORDER BY transaction_date ASC, document_identifier ASC
        """
        self.database_cursor.execute(
            unified_query,
            (society_id, start_date, end_date, society_id, start_date, end_date)
        )
        return self.database_cursor.fetchall()

    def fetch_vendor_payout_summary(
        self,
        society_id: int,
        vendor_id: int,
        financial_year_start_date: str,
        financial_year_end_date: str
    ) -> Dict[str, Any]:
        """
        Aggregates all vouchers paid to a specific vendor over the financial year.
        """
        vendor_details = self.fetch_vendor_by_id(vendor_id, society_id)
        if not vendor_details:
            return {}

        vouchers_query = """
            SELECT 
                voucher.voucher_id,
                voucher.voucher_number,
                voucher.voucher_date,
                head.head_name AS expense_head_name,
                voucher.invoice_bill_number,
                voucher.gross_amount_inr,
                voucher.tds_percentage,
                voucher.tds_deducted_amount_inr,
                voucher.net_payable_amount_inr,
                voucher.payment_mode,
                voucher.payment_reference_number,
                voucher.payment_date,
                voucher.payment_status,
                voucher.invoice_attachment_url,
                voucher.invoice_attachment_filename
            FROM society_expense_vouchers voucher
            INNER JOIN society_expense_heads head ON voucher.expense_head_id = head.expense_head_id
            WHERE voucher.society_id = %s
              AND voucher.vendor_id = %s
              AND voucher.voucher_date >= %s
              AND voucher.voucher_date <= %s
            ORDER BY voucher.voucher_date DESC
        """
        self.database_cursor.execute(
            vouchers_query,
            (society_id, vendor_id, financial_year_start_date, financial_year_end_date)
        )
        voucher_records = self.database_cursor.fetchall()

        total_gross_billed = sum(float(item["gross_amount_inr"]) for item in voucher_records)
        total_tds_deducted = sum(float(item["tds_deducted_amount_inr"]) for item in voucher_records)
        total_net_disbursed = sum(float(item["net_payable_amount_inr"]) for item in voucher_records)

        return {
            "vendor": vendor_details,
            "financial_year_start_date": financial_year_start_date,
            "financial_year_end_date": financial_year_end_date,
            "total_vouchers_count": len(voucher_records),
            "total_gross_billed_inr": total_gross_billed,
            "total_tds_deducted_inr": total_tds_deducted,
            "total_net_disbursed_inr": total_net_disbursed,
            "vouchers": voucher_records
        }
