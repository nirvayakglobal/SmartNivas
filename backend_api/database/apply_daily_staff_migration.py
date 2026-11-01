"""
Smart Nivas - Daily Staff & Helper Management Database Migration Runner
Applies daily_staff_schema.sql and seeds default staff configuration.
"""

import sys
import os
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
)


def apply_daily_staff_migration():
    schema_file_path = os.path.join(os.path.dirname(__file__), "daily_staff_schema.sql")

    with open(schema_file_path, "r", encoding="utf-8") as schema_file_handle:
        raw_schema_script = schema_file_handle.read()

    print("[MIGRATION] Applying Daily Staff & Helper Management Schema...")

    with global_database_connection_manager.database_transaction_scope() as database_cursor:
        for raw_statement in raw_schema_script.split(";"):
            clean_statement = raw_statement.strip()
            statement_lines = [
                line
                for line in clean_statement.split("\n")
                if line.strip() and not line.strip().startswith("--")
            ]
            executable_statement = "\n".join(statement_lines).strip()

            if executable_statement:
                first_line = executable_statement.split("\n")[0]
                print(f" -> Executing: {first_line[:80]}...")
                database_cursor.execute(executable_statement)

        # Seed default configuration for existing societies
        database_cursor.execute("SELECT society_id, society_legal_name FROM societies")
        societies = database_cursor.fetchall()
        for soc in societies:
            soc_id = str(soc["society_id"])
            database_cursor.execute(
                "SELECT config_id FROM society_staff_config WHERE society_id = %s",
                (soc_id,),
            )
            if not database_cursor.fetchone():
                database_cursor.execute(
                    """
                    INSERT INTO society_staff_config 
                    (config_id, society_id, enforce_mandatory_id_proof, enforce_mandatory_police_verification, daily_entry_start_time, daily_entry_cutoff_time, allow_emergency_night_entry)
                    VALUES (%s, %s, TRUE, FALSE, '06:00:00', '22:00:00', FALSE)
                    """,
                    (str(uuid.uuid4()), soc_id),
                )
                print(f" -> Initialized default staff configuration for society: {soc.get('society_legal_name', soc_id)}")

    print("[MIGRATION SUCCESS] Daily Staff & Helper tables & configs successfully initialized.")


if __name__ == "__main__":
    apply_daily_staff_migration()
