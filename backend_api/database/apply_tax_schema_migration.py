"""
Database Migration: Add GST & Tax Columns to Financial Billing Schema
Ensures support for Tax/GST Output reporting and legal GST thresholds.
"""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
)

def run_tax_schema_migration():
    print("Running GST & Tax Schema Migration...")
    with global_database_connection_manager.database_transaction_scope() as cur:
        # Check flat_invoices columns
        cur.execute("SHOW COLUMNS FROM flat_invoices LIKE 'gst_rate_percent'")
        if not cur.fetchone():
            cur.execute("""
                ALTER TABLE flat_invoices
                ADD COLUMN taxable_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER penalty_amount_inr,
                ADD COLUMN gst_rate_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER taxable_amount_inr,
                ADD COLUMN gst_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER gst_rate_percent
            """)
            print(" -> Added `taxable_amount_inr`, `gst_rate_percent`, `gst_amount_inr` to `flat_invoices`.")
        else:
            print(" -> GST columns already exist in `flat_invoices`.")

        # Backfill existing invoices
        cur.execute("""
            UPDATE flat_invoices
            SET taxable_amount_inr = base_maintenance_amount_inr + additional_heads_amount_inr
            WHERE taxable_amount_inr = 0.00
        """)

        # Check society_billing_configurations columns
        cur.execute("SHOW COLUMNS FROM society_billing_configurations LIKE 'enable_gst'")
        if not cur.fetchone():
            cur.execute("""
                ALTER TABLE society_billing_configurations
                ADD COLUMN enable_gst BOOLEAN NOT NULL DEFAULT FALSE AFTER upi_vpa,
                ADD COLUMN gst_rate_percent DECIMAL(5,2) NOT NULL DEFAULT 18.00 AFTER enable_gst,
                ADD COLUMN gst_exemption_limit_inr DECIMAL(10,2) NOT NULL DEFAULT 7500.00 AFTER gst_rate_percent,
                ADD COLUMN society_gstin VARCHAR(25) NULL AFTER gst_exemption_limit_inr
            """)
            print(" -> Added GST fields to `society_billing_configurations`.")
        else:
            print(" -> GST fields already exist in `society_billing_configurations`.")

    print("GST & Tax Schema Migration Completed Successfully.")

if __name__ == "__main__":
    run_tax_schema_migration()
