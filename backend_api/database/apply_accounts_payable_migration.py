"""
Smart Nivas - Accounts Payable & Expense Management Database Migration Runner
Applies the accounts_payable_schema.sql to the MySQL database safely with default seed heads.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
)

def apply_accounts_payable_migration():
    schema_file_path = os.path.join(os.path.dirname(__file__), "accounts_payable_schema.sql")
    
    with open(schema_file_path, "r", encoding="utf-8") as schema_file_handle:
        raw_schema_script = schema_file_handle.read()

    print("[MIGRATION] Applying Accounts Payable & Expense Management Schema...")
    
    with global_database_connection_manager.database_transaction_scope() as database_cursor:
        for raw_statement in raw_schema_script.split(";"):
            clean_statement = raw_statement.strip()
            # remove comment lines
            statement_lines = [line for line in clean_statement.split("\n") if not line.strip().startswith("--")]
            executable_statement = "\n".join(statement_lines).strip()
            if executable_statement:
                database_cursor.execute(executable_statement)
                if "CREATE TABLE" in executable_statement.upper():
                    table_header = executable_statement.split("(")[0].strip()
                    print(f" -> Executed: {table_header}")

        # Seed default expense heads and TDS configurations for existing societies
        database_cursor.execute("SELECT society_id FROM societies")
        existing_society_records = database_cursor.fetchall()

        default_expense_heads = [
            ("UTILITIES", "Diesel for Generator", "Fuel purchases for back-up diesel generator"),
            ("REPAIRS_MAINTENANCE", "Lift Maintenance (AMC & Repairs)", "Elevator periodic maintenance, AMC and spare parts"),
            ("SECURITY_SERVICES", "Security Agency Salaries", "Monthly billing for manned security guards and supervisor"),
            ("UTILITIES", "Common Electricity Bill (MGVCL/UGVCL/DGVCL)", "Common area lighting, water pump and elevator power bills"),
            ("CLEANING_HOUSEKEEPING", "Housekeeping & Cleaning Supplies", "Sweepers, corridor cleaning chemicals and dustbins"),
            ("REPAIRS_MAINTENANCE", "Plumbing & Borewell Water Repairs", "Pump motor servicing, valve repairs and pipeline work"),
            ("ADMINISTRATIVE", "Audit & Accounting Fees", "Chartered Accountant audit, software subscriptions and filing"),
            ("ADMINISTRATIVE", "Stationery & Office Expenses", "Register books, printer toner, and notice board stationery"),
            ("REPAIRS_MAINTENANCE", "Gardening & Landscaping Services", "Gardener charges, plants, fertilizers and trimming tools")
        ]

        default_tds_configs = [
            ("194C_INDIVIDUAL", "Contractor - Individual / HUF", 1.00, 30000.00),
            ("194C_COMPANY", "Contractor - Company / Firm", 2.00, 30000.00),
            ("194J_PROFESSIONAL", "Professional / Technical / CA", 10.00, 30000.00),
            ("194I_RENT", "Rent / Lease of Machinery/Premises", 10.00, 240000.00)
        ]

        for society_record in existing_society_records:
            target_society_id = society_record["society_id"]

            for category_code, head_name, description in default_expense_heads:
                database_cursor.execute(
                    """
                    INSERT IGNORE INTO society_expense_heads 
                    (society_id, category_code, head_name, description, is_active)
                    VALUES (%s, %s, %s, %s, TRUE)
                    """,
                    (target_society_id, category_code, head_name, description)
                )

            for section_code, vendor_type, tds_rate, threshold_limit in default_tds_configs:
                database_cursor.execute(
                    """
                    INSERT INTO society_tds_tax_configurations
                    (society_id, section_code, vendor_type, tds_percentage, threshold_limit_inr, is_active)
                    SELECT %s, %s, %s, %s, %s, TRUE
                    WHERE NOT EXISTS (
                        SELECT 1 FROM society_tds_tax_configurations 
                        WHERE society_id = %s AND section_code = %s
                    )
                    """,
                    (target_society_id, section_code, vendor_type, tds_rate, threshold_limit, target_society_id, section_code)
                )

    print("[SUCCESS] Accounts Payable & Expense Management Schema applied successfully!")

if __name__ == "__main__":
    apply_accounts_payable_migration()
