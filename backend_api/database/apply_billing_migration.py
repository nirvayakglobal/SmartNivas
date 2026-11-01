"""
Database Migration: Apply Financial & Maintenance Billing Schema
Safe execution: adds super_builtup_area_sqft to flats if missing, then runs financial_billing_schema.sql
"""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
)

def run_billing_migration():
    print("Running Financial & Maintenance Billing migration...")
    schema_path = os.path.join(os.path.dirname(__file__), "financial_billing_schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    with global_database_connection_manager.database_transaction_scope() as cur:
        # Check if super_builtup_area_sqft exists on flats
        cur.execute("SHOW COLUMNS FROM flats LIKE 'super_builtup_area_sqft'")
        if not cur.fetchone():
            cur.execute("ALTER TABLE flats ADD COLUMN super_builtup_area_sqft DECIMAL(10,2) NOT NULL DEFAULT 1000.00 AFTER floor_number")
            print(" -> Added `super_builtup_area_sqft` column to `flats` table.")
        else:
            print(" -> `super_builtup_area_sqft` column already exists.")

        # Execute table creations from SQL file
        for raw_stmt in sql_content.split(";"):
            clean_stmt = raw_stmt.strip()
            # remove comments
            lines = [l for l in clean_stmt.split("\n") if not l.strip().startswith("--")]
            stmt = "\n".join(lines).strip()
            if stmt:
                cur.execute(stmt)
                if "CREATE TABLE" in stmt.upper():
                    header = stmt.split("(")[0].strip()
                    print(f" -> Executed: {header}")

    print("Billing schema migration executed successfully!")

if __name__ == "__main__":
    run_billing_migration()
