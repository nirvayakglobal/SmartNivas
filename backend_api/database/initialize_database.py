"""
Database Initialization Script for Smart Nivas
Executes phase1_mysql_innodb_schema.sql against MySQL (local XAMPP/WAMP/Hostinger).
Creates database 'smart_nivas_production_db' if it does not already exist,
and runs all DDL table definitions and seed records.
Strictly adheres to SKILL.md (zero single-letter variables).
"""

import os
import sys
import pymysql

project_root_directory: str = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
if project_root_directory not in sys.path:
    sys.path.insert(0, project_root_directory)

from backend_api.environment_configuration import global_application_configuration


def initialize_smart_nivas_database() -> bool:
    print("=================================================================")
    print(" SMART NIVAS — DATABASE SCHEMA & SEED DATA INITIALIZER")
    print(" Operating Entity: Niravayak Global")
    print("=================================================================")

    target_database_host: str = global_application_configuration.mysql_database_host
    target_database_port: int = global_application_configuration.mysql_database_port
    target_database_user: str = global_application_configuration.mysql_database_user
    target_database_password: str = (
        global_application_configuration.mysql_database_password
    )
    target_database_name: str = global_application_configuration.mysql_database_name

    print(
        f"Connecting to MySQL server at {target_database_host}:{target_database_port} (User: {target_database_user})..."
    )

    try:
        server_connection: pymysql.Connection = pymysql.connect(
            host=target_database_host,
            port=target_database_port,
            user=target_database_user,
            password=target_database_password,
            charset="utf8mb4",
            autocommit=True,
        )
    except Exception as connection_error:
        print(f"[ERROR] Failed to connect to MySQL server: {connection_error}")
        print("Please verify that MySQL (e.g. XAMPP / MySQL Service) is running.")
        return False

    try:
        with server_connection.cursor() as server_cursor:
            print(
                f"Ensuring database '{target_database_name}' exists with utf8mb4 collation..."
            )
            create_database_statement: str = (
                f"CREATE DATABASE IF NOT EXISTS `{target_database_name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
            server_cursor.execute(create_database_statement)
            server_cursor.execute(f"USE `{target_database_name}`")
            print(f"[OK] Database '{target_database_name}' is ready.")

        server_connection.close()

        # Connect directly to target database
        database_connection: pymysql.Connection = pymysql.connect(
            host=target_database_host,
            port=target_database_port,
            user=target_database_user,
            password=target_database_password,
            database=target_database_name,
            charset="utf8mb4",
            autocommit=False,
        )

        schema_file_path: str = os.path.join(
            project_root_directory,
            "backend_api",
            "database",
            "phase1_mysql_innodb_schema.sql",
        )

        if not os.path.exists(schema_file_path):
            print(f"[ERROR] Schema file not found at: {schema_file_path}")
            return False

        print(f"Reading schema file: {schema_file_path}...")
        with open(schema_file_path, "r", encoding="utf-8") as schema_file:
            raw_sql_content: str = schema_file.read()

        # Split SQL into individual statements
        raw_sql_statements: list[str] = raw_sql_content.split(";")
        executable_sql_statements: list[str] = []

        for statement_candidate in raw_sql_statements:
            cleaned_statement: str = statement_candidate.strip()
            # Ignore empty lines or comments-only chunks
            if not cleaned_statement:
                continue
            # Remove leading comments
            statement_lines: list[str] = [
                line_content
                for line_content in cleaned_statement.splitlines()
                if not line_content.strip().startswith("--")
            ]
            final_statement_text: str = "\n".join(statement_lines).strip()
            if final_statement_text:
                executable_sql_statements.append(final_statement_text)

        print(
            f"Executing {len(executable_sql_statements)} schema and seed data statements inside transaction..."
        )

        with database_connection.cursor() as database_cursor:
            database_cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            for statement_index, sql_statement in enumerate(
                executable_sql_statements, start=1
            ):
                database_cursor.execute(sql_statement)
            database_cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

        database_connection.commit()
        database_connection.close()

        print("[SUCCESS] All 11 MySQL InnoDB tables & seed data initialized successfully!")
        print("Default Super Admin: Phone 9999999999 | Password SuperAdmin@Niravayak2026!")
        return True

    except Exception as execution_error:
        print(f"[ERROR] Failed to execute database initialization: {execution_error}")
        return False


if __name__ == "__main__":
    is_initialization_successful: bool = initialize_smart_nivas_database()
    if not is_initialization_successful:
        sys.exit(1)
    sys.exit(0)
