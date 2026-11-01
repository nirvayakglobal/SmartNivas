"""
Database Reset Script for Smart Nivas
Truncates all society, tenant, visitor, flat, wing, invoice, and lead data.
Preserves:
  - Super Admin account (Niravayak HQ)
  - Subscription Plans master catalog
"""

from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
)

def reset_database_to_clean_slate():
    print("Beginning database truncation for Smart Nivas...")
    with global_database_connection_manager.database_transaction_scope() as database_cursor:
        database_cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

        tables_to_truncate = [
            "visit_logs",
            "pre_approvals",
            "push_subscriptions",
            "notices",
            "society_visitors",
            "gates",
            "flats",
            "wings",
            "b2b_invoices",
            "crm_leads",
            "societies",
        ]

        for table_name in tables_to_truncate:
            database_cursor.execute(f"TRUNCATE TABLE `{table_name}`;")
            print(f" -> Truncated `{table_name}`")

        # Retain only the SUPER_ADMIN account
        database_cursor.execute("DELETE FROM `users` WHERE `user_role` != 'SUPER_ADMIN';")
        print(" -> Removed all society-level users (Admins, Residents, Guards)")

        database_cursor.execute("ALTER TABLE `users` AUTO_INCREMENT = 2;")

        database_cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        print(" -> Foreign key constraints restored.")

    print("\nDatabase reset complete. Database is clean and ready for new society onboarding via CRM.")

if __name__ == "__main__":
    reset_database_to_clean_slate()
