"""
Financial and Maintenance Billing Service
Business Logic Layer (Single Responsibility Principle) for Smart Nivas Accounts Receivable.
Calculates maintenance dynamically (fixed or per-sqft), late fee grace periods & penalties,
bulk invoice generation, payment reconciliation, and double-entry ledger balance updates.
"""

from datetime import datetime, date
from typing import Any, Dict, List, Optional, Tuple
import urllib.parse

from backend_api.repositories.society_billing_repository import SocietyBillingRepository
from backend_api.database.mysql_connection_pool_manager import (
    MySQLConnectionPoolManager,
    global_database_connection_manager,
)


class SocietyBillingService:
    """
    Orchestrates maintenance billing, rules engine, ledger tracking, and payment receipts.
    """

    def __init__(
        self,
        billing_repository: Optional[SocietyBillingRepository] = None,
        database_connection_manager: MySQLConnectionPoolManager = global_database_connection_manager,
    ) -> None:
        self._billing_repository = billing_repository or SocietyBillingRepository()
        self._database_connection_manager = database_connection_manager

    # =========================================================================
    # 1. Configuration & Master Heads
    # =========================================================================

    def get_or_initialize_configuration(
        self, society_id: int
    ) -> Dict[str, Any]:
        with self._database_connection_manager.database_transaction_scope() as cur:
            config = self._billing_repository.get_billing_configuration(cur, society_id)
            if not config:
                # Seed sensible defaults
                default_config = {
                    "calculation_mode": "FIXED_PER_FLAT",
                    "fixed_monthly_rate_inr": 2000.00,
                    "rate_per_sqft_inr": 2.50,
                    "due_day_of_month": 10,
                    "grace_period_days": 5,
                    "penalty_type": "FLAT_FEE",
                    "penalty_amount_or_rate": 500.00,
                    "beneficiary_name": "Society Maintenance Account",
                    "bank_name": "State Bank of India",
                    "account_number": "",
                    "ifsc_code": "",
                    "upi_vpa": "smartnivas@upi",
                }
                self._billing_repository.upsert_billing_configuration(
                    cur, society_id, default_config
                )
                config = self._billing_repository.get_billing_configuration(cur, society_id)

            # Ensure default master heads exist
            heads = self._billing_repository.list_billing_heads(cur, society_id)
            if not heads:
                default_heads = [
                    ("General Maintenance", 0.00, True),
                    ("Sinking Fund", 500.00, True),
                    ("Repair & Replacement Fund", 250.00, False),
                    ("Non-Occupancy Charges", 300.00, False),
                    ("Car Parking Dues", 200.00, False),
                ]
                for head_name, amount, is_mand in default_heads:
                    self._billing_repository.create_billing_head(
                        cur, society_id, head_name, amount, is_mand
                    )
                heads = self._billing_repository.list_billing_heads(cur, society_id)

            return {
                "configuration": config,
                "billing_heads": heads,
            }

    def update_configuration(
        self, society_id: int, config_payload: Dict[str, Any]
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        # Validate calculation mode
        calc_mode = config_payload.get("calculation_mode", "FIXED_PER_FLAT")
        if calc_mode not in ["FIXED_PER_FLAT", "PER_SQFT_AREA"]:
            return False, "Calculation mode must be FIXED_PER_FLAT or PER_SQFT_AREA.", None

        with self._database_connection_manager.database_transaction_scope() as cur:
            self._billing_repository.upsert_billing_configuration(
                cur, society_id, config_payload
            )
            updated_config = self._billing_repository.get_billing_configuration(
                cur, society_id
            )
            return True, "Billing configuration updated successfully.", updated_config

    def create_custom_billing_head(
        self, society_id: int, head_name: str, default_amount: float, is_mandatory: bool
    ) -> Tuple[bool, str, Optional[int]]:
        clean_name = head_name.strip()
        if not clean_name:
            return False, "Billing head name cannot be empty.", None

        with self._database_connection_manager.database_transaction_scope() as cur:
            head_id = self._billing_repository.create_billing_head(
                cur, society_id, clean_name, float(default_amount), is_mandatory
            )
            return True, "Billing head created successfully.", head_id

    # =========================================================================
    # 2. Dashboard Summary
    # =========================================================================

    def get_dashboard_summary(self, society_id: int) -> Dict[str, Any]:
        with self._database_connection_manager.database_read_scope() as cur:
            return self._billing_repository.get_dashboard_summary(cur, society_id)

    # =========================================================================
    # 3. Bulk Invoice Generation
    # =========================================================================

    def preview_invoice_generation(
        self,
        society_id: int,
        billing_period_month: str, # "YYYY-MM", e.g. "2026-11"
        billing_period_label: str, # "November 2026"
        selected_heads: List[Dict[str, Any]], # [{"head_name": "Sinking Fund", "amount_inr": 500.00}]
    ) -> Dict[str, Any]:
        """
        Simulates generation: calculates base amount per flat based on rules (fixed vs sqft)
        and sums selected additional heads.
        """
        with self._database_connection_manager.database_read_scope() as cur:
            config = self._billing_repository.get_billing_configuration(cur, society_id)
            flats = self._billing_repository.get_flats_for_billing(cur, society_id)
            already_generated = self._billing_repository.check_invoices_exist_for_month(
                cur, society_id, billing_period_month
            )

        calc_mode = config.get("calculation_mode", "FIXED_PER_FLAT") if config else "FIXED_PER_FLAT"
        fixed_rate = float(config.get("fixed_monthly_rate_inr", 2000.00)) if config else 2000.00
        sqft_rate = float(config.get("rate_per_sqft_inr", 2.50)) if config else 2.50

        additional_heads_total = sum(float(h.get("amount_inr", 0.0)) for h in selected_heads)

        flat_previews = []
        grand_total_inr = 0.0

        for f in flats:
            area = float(f.get("super_builtup_area_sqft") or 1000.00)
            if calc_mode == "PER_SQFT_AREA":
                base_maintenance = round(area * sqft_rate, 2)
            else:
                base_maintenance = fixed_rate

            total_flat_invoice = round(base_maintenance + additional_heads_total, 2)
            grand_total_inr += total_flat_invoice

            flat_previews.append({
                "flat_id": f["flat_id"],
                "wing_name": f["wing_name"],
                "flat_number": f["flat_number"],
                "resident_name": f.get("resident_name") or "Vacant / Unassigned",
                "area_sqft": area,
                "base_maintenance_inr": base_maintenance,
                "additional_heads_inr": additional_heads_total,
                "total_invoice_inr": total_flat_invoice,
            })

        return {
            "billing_period_month": billing_period_month,
            "billing_period_label": billing_period_label,
            "flats_count": len(flats),
            "already_generated_count": already_generated,
            "calculation_mode": calc_mode,
            "rate_used": sqft_rate if calc_mode == "PER_SQFT_AREA" else fixed_rate,
            "additional_heads": selected_heads,
            "grand_total_inr": round(grand_total_inr, 2),
            "sample_flats": flat_previews[:15], # First 15 for preview modal table
            "all_flats_preview": flat_previews,
        }

    def generate_bulk_invoices(
        self,
        society_id: int,
        billing_period_month: str,
        billing_period_label: str,
        due_date_str: str, # "YYYY-MM-DD"
        selected_heads: List[Dict[str, Any]],
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Executes bulk invoice creation inside an ACID transaction.
        Writes flat_invoices, line items, and debits flat_ledger_entries.
        """
        today_date = date.today()
        try:
            parsed_due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
        except Exception:
            parsed_due_date = today_date

        with self._database_connection_manager.database_transaction_scope() as cur:
            # Check if invoices already generated for this month
            existing_count = self._billing_repository.check_invoices_exist_for_month(
                cur, society_id, billing_period_month
            )
            if existing_count > 0:
                return (
                    False,
                    f"Invoices for {billing_period_label} have already been generated ({existing_count} existing).",
                    {"existing_count": existing_count},
                )

            config = self._billing_repository.get_billing_configuration(cur, society_id)
            flats = self._billing_repository.get_flats_for_billing(cur, society_id)
            if not flats:
                return False, "No flats found in society to generate invoices for.", {}

            calc_mode = config.get("calculation_mode", "FIXED_PER_FLAT") if config else "FIXED_PER_FLAT"
            fixed_rate = float(config.get("fixed_monthly_rate_inr", 2000.00)) if config else 2000.00
            sqft_rate = float(config.get("rate_per_sqft_inr", 2.50)) if config else 2.50
            additional_heads_total = sum(float(h.get("amount_inr", 0.0)) for h in selected_heads)

            # GST Parameters
            enable_gst = bool(config.get("enable_gst", False)) if config else False
            gst_rate = float(config.get("gst_rate_percent", 18.00)) if config else 18.00
            exemption_limit = float(config.get("gst_exemption_limit_inr", 7500.00)) if config else 7500.00

            invoices_created_count = 0
            total_amount_billed = 0.0

            clean_month_tag = billing_period_month.replace("-", "")

            for f in flats:
                area = float(f.get("super_builtup_area_sqft") or 1000.00)
                if calc_mode == "PER_SQFT_AREA":
                    base_maint = round(area * sqft_rate, 2)
                    base_label = f"Maintenance ({area} sq.ft. @ ₹{sqft_rate}/sq.ft.)"
                else:
                    base_maint = fixed_rate
                    base_label = f"Fixed Maintenance"

                taxable_amount = round(base_maint + additional_heads_total, 2)
                gst_amount = 0.00
                applied_gst_rate = 0.00

                # Statutory Exemption Check: Maintenance under threshold is exempt from GST
                if enable_gst and taxable_amount > exemption_limit:
                    applied_gst_rate = gst_rate
                    gst_amount = round((taxable_amount * gst_rate) / 100.0, 2)

                total_amount = round(taxable_amount + gst_amount, 2)
                inv_number = f"INV-{clean_month_tag}-{f['wing_name']}{f['flat_number']}"

                # 1. Insert Invoice
                invoice_id = self._billing_repository.insert_flat_invoice(
                    cur,
                    {
                        "society_id": society_id,
                        "flat_id": f["flat_id"],
                        "invoice_number": inv_number,
                        "billing_period_month": billing_period_month,
                        "billing_period_label": billing_period_label,
                        "issue_date": today_date,
                        "due_date": parsed_due_date,
                        "base_maintenance_amount_inr": base_maint,
                        "additional_heads_amount_inr": additional_heads_total,
                        "penalty_amount_inr": 0.00,
                        "taxable_amount_inr": taxable_amount,
                        "gst_rate_percent": applied_gst_rate,
                        "gst_amount_inr": gst_amount,
                        "total_invoice_amount_inr": total_amount,
                    },
                )

                # 2. Insert Line Items
                line_items = [{"head_name": base_label, "amount_inr": base_maint}]
                for h in selected_heads:
                    line_items.append({
                        "head_name": h.get("head_name", "Fee"),
                        "amount_inr": float(h.get("amount_inr", 0.0)),
                    })
                if gst_amount > 0:
                    half_rate = gst_rate / 2.0
                    line_items.append({
                        "head_name": f"CGST ({half_rate}%)",
                        "amount_inr": round(gst_amount / 2.0, 2),
                    })
                    line_items.append({
                        "head_name": f"SGST ({half_rate}%)",
                        "amount_inr": round(gst_amount / 2.0, 2),
                    })
                self._billing_repository.insert_invoice_line_items(cur, invoice_id, line_items)

                # 3. Insert Debit to Flat Ledger
                self._billing_repository.insert_ledger_entry(
                    cur,
                    {
                        "society_id": society_id,
                        "flat_id": f["flat_id"],
                        "entry_date": today_date,
                        "entry_type": "INVOICE_DEBIT",
                        "reference_id": inv_number,
                        "description": f"Invoice issued for {billing_period_label}",
                        "debit_amount_inr": total_amount,
                        "credit_amount_inr": 0.00,
                        "running_balance_inr": total_amount,
                    },
                )

                invoices_created_count += 1
                total_amount_billed += total_amount

            return True, f"Successfully generated {invoices_created_count} invoices.", {
                "invoices_created": invoices_created_count,
                "total_billed_inr": round(total_amount_billed, 2),
                "billing_period": billing_period_label,
            }

    # =========================================================================
    # 4. Ledger & Flat Invoices
    # =========================================================================

    def get_flats_ledger(self, society_id: int) -> List[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as cur:
            return self._billing_repository.get_society_flats_ledger_overview(cur, society_id)

    def get_flat_statement(
        self, society_id: int, flat_id: int
    ) -> Dict[str, Any]:
        with self._database_connection_manager.database_read_scope() as cur:
            entries = self._billing_repository.get_flat_ledger_entries(cur, society_id, flat_id)
            unpaid_invoices = self._billing_repository.get_flat_unpaid_invoices(cur, society_id, flat_id)
            return {
                "flat_id": flat_id,
                "ledger_entries": entries,
                "unpaid_invoices": unpaid_invoices,
            }

    # =========================================================================
    # 5. Payment Recording & Reconciliation
    # =========================================================================

    def record_manual_payment(
        self,
        society_id: int,
        recorded_by_user_id: int,
        payment_payload: Dict[str, Any],
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Records payment for a flat, applies it against specific invoice (or oldest unpaid),
        and adds credit entry to ledger.
        """
        flat_id = int(payment_payload["flat_id"])
        amount_paid = float(payment_payload["amount_paid_inr"])
        payment_mode = payment_payload.get("payment_mode", "CASH")
        payment_date_str = payment_payload.get("payment_date", date.today().isoformat())

        if amount_paid <= 0:
            return False, "Amount paid must be greater than zero.", None

        receipt_number = f"REC-{datetime.now().strftime('%Y%m%d%H%M%S')}-F{flat_id}"

        with self._database_connection_manager.database_transaction_scope() as cur:
            target_invoice_id = payment_payload.get("invoice_id")
            if not target_invoice_id:
                # Find oldest unpaid invoice for this flat
                unpaid = self._billing_repository.get_flat_unpaid_invoices(cur, society_id, flat_id)
                if unpaid:
                    target_invoice_id = unpaid[0]["invoice_id"]

            # Record payment receipt
            payment_id = self._billing_repository.record_payment_receipt(
                cur,
                {
                    "society_id": society_id,
                    "flat_id": flat_id,
                    "invoice_id": target_invoice_id,
                    "receipt_number": receipt_number,
                    "amount_paid_inr": amount_paid,
                    "payment_mode": payment_mode,
                    "transaction_reference": payment_payload.get("transaction_reference"),
                    "cheque_number": payment_payload.get("cheque_number"),
                    "cheque_date": payment_payload.get("cheque_date"),
                    "bank_name": payment_payload.get("bank_name"),
                    "deposit_slip_image_url": payment_payload.get("deposit_slip_image_url"),
                    "payment_date": payment_date_str,
                    "notes": payment_payload.get("notes"),
                    "recorded_by_user_id": recorded_by_user_id,
                },
            )

            # Update invoice balance if an invoice was tied
            if target_invoice_id:
                self._billing_repository.update_invoice_payment_progress(
                    cur, target_invoice_id, amount_paid
                )

            # Record credit entry to flat ledger
            desc = f"Payment received via {payment_mode}"
            if payment_payload.get("cheque_number"):
                desc += f" (Cheque #{payment_payload['cheque_number']})"
            elif payment_payload.get("transaction_reference"):
                desc += f" (Ref #{payment_payload['transaction_reference']})"

            self._billing_repository.insert_ledger_entry(
                cur,
                {
                    "society_id": society_id,
                    "flat_id": flat_id,
                    "entry_date": payment_date_str,
                    "entry_type": "PAYMENT_CREDIT",
                    "reference_id": receipt_number,
                    "description": desc,
                    "debit_amount_inr": 0.00,
                    "credit_amount_inr": amount_paid,
                    "running_balance_inr": 0.00,
                },
            )

            return True, "Payment recorded and ledger reconciled successfully.", {
                "payment_id": payment_id,
                "receipt_number": receipt_number,
                "amount_paid_inr": amount_paid,
            }

    # =========================================================================
    # 6. UPI Intent & QR Code Payload
    # =========================================================================

    def generate_invoice_upi_details(
        self, society_id: int, invoice_id: int
    ) -> Optional[Dict[str, Any]]:
        with self._database_connection_manager.database_read_scope() as cur:
            config = self._billing_repository.get_billing_configuration(cur, society_id)
            invoice = self._billing_repository.get_invoice_by_id(cur, society_id, invoice_id)

            if not invoice or not config:
                return None

            vpa = config.get("upi_vpa") or "smartnivas@upi"
            payee_name = config.get("beneficiary_name") or "Smart Nivas Housing Society"
            amount = float(invoice["outstanding_balance_inr"])
            note = f"Maint {invoice['invoice_number']}"

            # Standard NPCI UPI URI string
            # upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
            encoded_pn = urllib.parse.quote(payee_name)
            encoded_tn = urllib.parse.quote(note)
            upi_intent_uri = f"upi://pay?pa={vpa}&pn={encoded_pn}&am={amount:.2f}&cu=INR&tn={encoded_tn}"

            return {
                "invoice_number": invoice["invoice_number"],
                "flat_number": f"{invoice['wing_name']}-{invoice['flat_number']}",
                "resident_name": invoice["resident_name"],
                "amount_due_inr": amount,
                "upi_vpa": vpa,
                "payee_name": payee_name,
                "upi_intent_uri": upi_intent_uri,
                "bank_details": {
                    "bank_name": config.get("bank_name"),
                    "account_number": config.get("account_number"),
                    "ifsc_code": config.get("ifsc_code"),
                },
            }

    # =========================================================================
    # 7. Financial & Statutory Reports Service Methods
    # =========================================================================

    def get_defaulters_aging_report(
        self, society_id: int, as_of_date: Optional[str] = None
    ) -> Dict[str, Any]:
        with self._database_connection_manager.database_read_scope() as cur:
            records = self._billing_repository.get_defaulters_aging_report(
                cur, society_id, as_of_date
            )
            total_0_30 = sum(float(r["bucket_0_to_30_inr"]) for r in records)
            total_31_60 = sum(float(r["bucket_31_to_60_inr"]) for r in records)
            total_61_90 = sum(float(r["bucket_61_to_90_inr"]) for r in records)
            total_90_plus = sum(float(r["bucket_90_plus_inr"]) for r in records)
            grand_total = sum(float(r["total_overdue_balance_inr"]) for r in records)

            return {
                "as_of_date": as_of_date or date.today().isoformat(),
                "defaulter_units_count": len(records),
                "summary_buckets": {
                    "bucket_0_to_30_inr": total_0_30,
                    "bucket_31_to_60_inr": total_31_60,
                    "bucket_61_to_90_inr": total_61_90,
                    "bucket_90_plus_inr": total_90_plus,
                    "grand_total_overdue_inr": grand_total,
                },
                "defaulters": records,
            }

    def get_collection_report(
        self, society_id: int, start_date: str, end_date: str, group_by: str = "DAILY"
    ) -> Dict[str, Any]:
        with self._database_connection_manager.database_read_scope() as cur:
            return self._billing_repository.get_collection_report(
                cur, society_id, start_date, end_date, group_by
            )

    def get_tax_gst_output_report(
        self, society_id: int, start_date: str, end_date: str
    ) -> Dict[str, Any]:
        with self._database_connection_manager.database_read_scope() as cur:
            return self._billing_repository.get_tax_gst_output_report(
                cur, society_id, start_date, end_date
            )

