"""
Smart Nivas - Helpdesk & Complaint Management Database Migration Runner
Applies helpdesk_schema.sql to MySQL and seeds standard complaint categories with SLA timers.
"""

import sys
import os
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
)


def apply_helpdesk_migration():
    schema_file_path = os.path.join(os.path.dirname(__file__), "helpdesk_schema.sql")

    with open(schema_file_path, "r", encoding="utf-8") as schema_file_handle:
        raw_schema_script = schema_file_handle.read()

    print("[MIGRATION] Applying Helpdesk & Complaint Management Schema...")

    with global_database_connection_manager.database_transaction_scope() as database_cursor:
        for raw_statement in raw_schema_script.split(";"):
            clean_statement = raw_statement.strip()
            statement_lines = [
                line
                for line in clean_statement.split("\n")
                if not line.strip().startswith("--")
            ]
            executable_statement = "\n".join(statement_lines).strip()
            if executable_statement:
                database_cursor.execute(executable_statement)
                if "CREATE TABLE" in executable_statement.upper():
                    table_header = executable_statement.split("(")[0].strip()
                    print(f" -> Executed: {table_header}")

        # Seed standard complaint categories for each existing society
        database_cursor.execute("SELECT society_id, society_legal_name FROM societies")
        existing_societies = database_cursor.fetchall()

        standard_categories = [
            ("Plumbing", "Water leakage, tap repairs, pipe bursts, drainage blocks", 24, "Droplet", "blue"),
            ("Electrical", "Power failures, tripping MCB, common corridor light repairs, elevator power issues", 12, "Zap", "amber"),
            ("Civil & Carpentry", "Door lock jams, window sill cracks, plaster seepage, carpentry works", 48, "Hammer", "stone"),
            ("Housekeeping", "Common corridor cleaning, staircase sweep, garbage bin overflow", 8, "Sparkles", "emerald"),
            ("Elevator / Lift", "Lift stoppage, sensor malfunction, jerk or sound during operation", 6, "ArrowUpDown", "rose"),
            ("Security & Intercom", "Intercom line dead, boom barrier sensor issue, guard patrol request", 12, "ShieldAlert", "indigo"),
        ]

        for society in existing_societies:
            target_society_id = society["society_id"]
            for (
                category_name,
                description,
                sla_hours,
                icon_name,
                badge_color,
            ) in standard_categories:
                database_cursor.execute(
                    """
                    SELECT category_id FROM helpdesk_categories 
                    WHERE society_id = %s AND category_name = %s
                    """,
                    (target_society_id, category_name),
                )
                existing = database_cursor.fetchone()
                if not existing:
                    category_id = str(uuid.uuid4())
                    database_cursor.execute(
                        """
                        INSERT INTO helpdesk_categories (
                            category_id, society_id, category_name, description, 
                            sla_resolution_hours, icon_name, badge_color, is_active
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
                        """,
                        (
                            category_id,
                            target_society_id,
                            category_name,
                            description,
                            sla_hours,
                            icon_name,
                            badge_color,
                        ),
                    )
            print(f" -> Configured standard categories & SLA for society: {society['society_legal_name']}")

    print("[MIGRATION SUCCESS] Helpdesk & Complaint Management tables & categories ready.")


if __name__ == "__main__":
    apply_helpdesk_migration()
