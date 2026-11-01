"""
Smart Nivas - Society Accounts Payable & Expense Service
Business logic layer managing ACID transactions, TDS deductions, AMC renewals, voucher creations, and financial calculations.
Strictly follows SKILL.md: Zero single-letter variables, ACID transactional scopes, clear descriptive names.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date
from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
)
from backend_api.repositories.society_accounts_payable_repository import (
    SocietyAccountsPayableRepository,
)

class SocietyAccountsPayableService:
    """Orchestrates business operations for Accounts Payable and Expense Accounting."""

    # =========================================================================
    # 1. CHART OF ACCOUNTS (EXPENSE HEADS)
    # =========================================================================

    @staticmethod
    def get_expense_heads(society_id: int, only_active: bool = False) -> List[Dict[str, Any]]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            return payable_repository.fetch_expense_heads(society_id, only_active)

    @staticmethod
    def add_expense_head(
        society_id: int,
        category_code: str,
        head_name: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            new_head_id = payable_repository.create_expense_head(
                society_id=society_id,
                category_code=category_code.strip().upper(),
                head_name=head_name.strip(),
                description=description.strip() if description else None
            )
            return {
                "success": True,
                "expense_head_id": new_head_id,
                "message": f"Expense head '{head_name}' added to Chart of Accounts."
            }

    @staticmethod
    def update_expense_head(
        expense_head_id: int,
        society_id: int,
        category_code: str,
        head_name: str,
        description: Optional[str],
        is_active: bool
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            payable_repository.update_expense_head(
                expense_head_id=expense_head_id,
                society_id=society_id,
                category_code=category_code.strip().upper(),
                head_name=head_name.strip(),
                description=description.strip() if description else None,
                is_active=is_active
            )
            return {
                "success": True,
                "message": f"Expense head '{head_name}' updated successfully."
            }

    # =========================================================================
    # 2. TDS TAX CONFIGURATIONS
    # =========================================================================

    @staticmethod
    def get_tds_configurations(society_id: int, only_active: bool = False) -> List[Dict[str, Any]]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            return payable_repository.fetch_tds_configurations(society_id, only_active)

    @staticmethod
    def add_tds_configuration(
        society_id: int,
        section_code: str,
        vendor_type: str,
        tds_percentage: float,
        threshold_limit_inr: float = 30000.00
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            new_config_id = payable_repository.create_tds_configuration(
                society_id=society_id,
                section_code=section_code.strip().upper(),
                vendor_type=vendor_type.strip(),
                tds_percentage=float(tds_percentage),
                threshold_limit_inr=float(threshold_limit_inr)
            )
            return {
                "success": True,
                "tds_config_id": new_config_id,
                "message": f"TDS rule {section_code} ({tds_percentage}%) added successfully."
            }

    @staticmethod
    def update_tds_configuration(
        tds_config_id: int,
        society_id: int,
        section_code: str,
        vendor_type: str,
        tds_percentage: float,
        threshold_limit_inr: float,
        is_active: bool
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            payable_repository.update_tds_configuration(
                tds_config_id=tds_config_id,
                society_id=society_id,
                section_code=section_code.strip().upper(),
                vendor_type=vendor_type.strip(),
                tds_percentage=float(tds_percentage),
                threshold_limit_inr=float(threshold_limit_inr),
                is_active=is_active
            )
            return {
                "success": True,
                "message": f"TDS rule {section_code} updated successfully."
            }

    # =========================================================================
    # 3. VENDOR DIRECTORY
    # =========================================================================

    @staticmethod
    def get_vendors(society_id: int, only_active: bool = False) -> List[Dict[str, Any]]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            return payable_repository.fetch_vendors(society_id, only_active)

    @staticmethod
    def create_vendor(
        society_id: int,
        vendor_name: str,
        contact_phone: str,
        vendor_type: str,
        contact_person: Optional[str] = None,
        contact_email: Optional[str] = None,
        gstin: Optional[str] = None,
        pan_number: Optional[str] = None,
        default_tds_config_id: Optional[int] = None,
        bank_name: Optional[str] = None,
        bank_account_number: Optional[str] = None,
        bank_ifsc_code: Optional[str] = None,
        upi_id: Optional[str] = None,
        service_description: Optional[str] = None
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            created_vendor_id = payable_repository.create_vendor(
                society_id=society_id,
                vendor_name=vendor_name.strip(),
                contact_person=contact_person.strip() if contact_person else None,
                contact_phone=contact_phone.strip(),
                contact_email=contact_email.strip() if contact_email else None,
                vendor_type=vendor_type.strip(),
                gstin=gstin.strip().upper() if gstin else None,
                pan_number=pan_number.strip().upper() if pan_number else None,
                default_tds_config_id=default_tds_config_id,
                bank_name=bank_name.strip() if bank_name else None,
                bank_account_number=bank_account_number.strip() if bank_account_number else None,
                bank_ifsc_code=bank_ifsc_code.strip().upper() if bank_ifsc_code else None,
                upi_id=upi_id.strip() if upi_id else None,
                service_description=service_description.strip() if service_description else None
            )
            return {
                "success": True,
                "vendor_id": created_vendor_id,
                "message": f"Vendor '{vendor_name}' saved to directory successfully."
            }

    @staticmethod
    def update_vendor(
        vendor_id: int,
        society_id: int,
        vendor_name: str,
        contact_phone: str,
        vendor_type: str,
        contact_person: Optional[str] = None,
        contact_email: Optional[str] = None,
        gstin: Optional[str] = None,
        pan_number: Optional[str] = None,
        default_tds_config_id: Optional[int] = None,
        bank_name: Optional[str] = None,
        bank_account_number: Optional[str] = None,
        bank_ifsc_code: Optional[str] = None,
        upi_id: Optional[str] = None,
        service_description: Optional[str] = None,
        is_active: bool = True
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            payable_repository.update_vendor(
                vendor_id=vendor_id,
                society_id=society_id,
                vendor_name=vendor_name.strip(),
                contact_person=contact_person.strip() if contact_person else None,
                contact_phone=contact_phone.strip(),
                contact_email=contact_email.strip() if contact_email else None,
                vendor_type=vendor_type.strip(),
                gstin=gstin.strip().upper() if gstin else None,
                pan_number=pan_number.strip().upper() if pan_number else None,
                default_tds_config_id=default_tds_config_id,
                bank_name=bank_name.strip() if bank_name else None,
                bank_account_number=bank_account_number.strip() if bank_account_number else None,
                bank_ifsc_code=bank_ifsc_code.strip().upper() if bank_ifsc_code else None,
                upi_id=upi_id.strip() if upi_id else None,
                service_description=service_description.strip() if service_description else None,
                is_active=is_active
            )
            return {
                "success": True,
                "message": f"Vendor '{vendor_name}' profile updated successfully."
            }

    # =========================================================================
    # 4. ANNUAL MAINTENANCE CONTRACTS (AMC TRACKER)
    # =========================================================================

    @staticmethod
    def get_amc_contracts(society_id: int) -> List[Dict[str, Any]]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            return payable_repository.fetch_amc_contracts(society_id)

    @staticmethod
    def create_amc_contract(
        society_id: int,
        vendor_id: int,
        expense_head_id: int,
        contract_title: str,
        start_date: str,
        end_date: str,
        contract_value_inr: float,
        billing_frequency: str = "QUARTERLY",
        contract_document_url: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            created_amc_id = payable_repository.create_amc_contract(
                society_id=society_id,
                vendor_id=vendor_id,
                expense_head_id=expense_head_id,
                contract_title=contract_title.strip(),
                start_date=start_date,
                end_date=end_date,
                contract_value_inr=float(contract_value_inr),
                billing_frequency=billing_frequency,
                contract_document_url=contract_document_url,
                notes=notes
            )
            return {
                "success": True,
                "amc_id": created_amc_id,
                "message": f"AMC '{contract_title}' registered successfully."
            }

    @staticmethod
    def update_amc_contract(
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
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            payable_repository.update_amc_contract(
                amc_id=amc_id,
                society_id=society_id,
                vendor_id=vendor_id,
                expense_head_id=expense_head_id,
                contract_title=contract_title.strip(),
                start_date=start_date,
                end_date=end_date,
                contract_value_inr=float(contract_value_inr),
                billing_frequency=billing_frequency,
                contract_document_url=contract_document_url,
                notes=notes,
                status=status
            )
            return {
                "success": True,
                "message": f"AMC contract '{contract_title}' updated successfully."
            }

    # =========================================================================
    # 5. EXPENSE VOUCHER JOURNAL & AUDIT TRAIL
    # =========================================================================

    @staticmethod
    def get_expense_vouchers(
        society_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        vendor_id: Optional[int] = None,
        expense_head_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            return payable_repository.fetch_expense_vouchers(
                society_id=society_id,
                start_date=start_date,
                end_date=end_date,
                vendor_id=vendor_id,
                expense_head_id=expense_head_id
            )

    @staticmethod
    def record_expense_voucher(
        society_id: int,
        voucher_date: str,
        expense_head_id: int,
        gross_amount_inr: float,
        payment_mode: str,
        payment_date: str,
        vendor_id: Optional[int] = None,
        amc_id: Optional[int] = None,
        tds_percentage: float = 0.00,
        payment_reference_number: Optional[str] = None,
        invoice_bill_number: Optional[str] = None,
        invoice_attachment_url: Optional[str] = None,
        invoice_attachment_filename: Optional[str] = None,
        payment_status: str = "PAID",
        remarks: Optional[str] = None,
        recorded_by_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calculates TDS deduction, net payable, generates atomic voucher number, and stores journal entry.
        """
        gross_amount = float(gross_amount_inr)
        tds_rate = float(tds_percentage)
        tds_deduction = round(gross_amount * (tds_rate / 100.0), 2) if tds_rate > 0 else 0.00
        net_payable = round(gross_amount - tds_deduction, 2)

        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            
            # Atomic sequential voucher number
            next_voucher_number = payable_repository.generate_next_voucher_number(
                society_id=society_id,
                voucher_date=voucher_date
            )

            created_voucher_id = payable_repository.create_expense_voucher(
                society_id=society_id,
                voucher_number=next_voucher_number,
                voucher_date=voucher_date,
                vendor_id=vendor_id,
                expense_head_id=expense_head_id,
                amc_id=amc_id,
                gross_amount_inr=gross_amount,
                tds_percentage=tds_rate,
                tds_deducted_amount_inr=tds_deduction,
                net_payable_amount_inr=net_payable,
                payment_mode=payment_mode,
                payment_reference_number=payment_reference_number.strip() if payment_reference_number else None,
                payment_date=payment_date,
                invoice_bill_number=invoice_bill_number.strip() if invoice_bill_number else None,
                invoice_attachment_url=invoice_attachment_url,
                invoice_attachment_filename=invoice_attachment_filename,
                payment_status=payment_status,
                remarks=remarks.strip() if remarks else None,
                recorded_by_user_id=recorded_by_user_id
            )

            return {
                "success": True,
                "voucher_id": created_voucher_id,
                "voucher_number": next_voucher_number,
                "gross_amount_inr": gross_amount,
                "tds_deducted_amount_inr": tds_deduction,
                "net_payable_amount_inr": net_payable,
                "message": f"Expense voucher {next_voucher_number} recorded successfully."
            }

    # =========================================================================
    # 6. REPORTS: P&L, CASHBOOK / LEDGER, VENDOR PAYOUT
    # =========================================================================

    @staticmethod
    def get_profit_and_loss_statement(
        society_id: int,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            return payable_repository.fetch_profit_and_loss_report(
                society_id=society_id,
                start_date=start_date,
                end_date=end_date
            )

    @staticmethod
    def get_cashbook_ledger(
        society_id: int,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            raw_transactions = payable_repository.fetch_cashbook_ledger_records(
                society_id=society_id,
                start_date=start_date,
                end_date=end_date
            )

            # Compute running balance
            running_cumulative_balance = 0.00
            computed_ledger_rows = []

            total_credit_inflow = 0.00
            total_debit_outflow = 0.00

            for transaction_item in raw_transactions:
                credit_amount = float(transaction_item["credit_inflow_inr"])
                debit_amount = float(transaction_item["debit_outflow_inr"])

                total_credit_inflow += credit_amount
                total_debit_outflow += debit_amount
                running_cumulative_balance += (credit_amount - debit_amount)

                transaction_dict = dict(transaction_item)
                transaction_dict["running_balance_inr"] = round(running_cumulative_balance, 2)
                computed_ledger_rows.append(transaction_dict)

            return {
                "start_date": start_date,
                "end_date": end_date,
                "total_credit_inflow_inr": round(total_credit_inflow, 2),
                "total_debit_outflow_inr": round(total_debit_outflow, 2),
                "closing_net_balance_inr": round(running_cumulative_balance, 2),
                "ledger_transactions": computed_ledger_rows
            }

    @staticmethod
    def get_vendor_payout_report(
        society_id: int,
        vendor_id: int,
        financial_year_start_date: str,
        financial_year_end_date: str
    ) -> Dict[str, Any]:
        with global_database_connection_manager.database_transaction_scope() as database_cursor:
            payable_repository = SocietyAccountsPayableRepository(database_cursor)
            return payable_repository.fetch_vendor_payout_summary(
                society_id=society_id,
                vendor_id=vendor_id,
                financial_year_start_date=financial_year_start_date,
                financial_year_end_date=financial_year_end_date
            )
