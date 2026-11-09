"""
Migration: Add flat_type to flats & tiered billing cycle support to society_billing_configurations.
Supports:
1. flats.flat_type ('REGULAR', 'PENTHOUSE', '2BHK', '3BHK', '4BHK', 'SHOP')
2. society_billing_configurations:
   - calculation_mode enum includes 'TIERED_FLAT_TYPE'
   - billing_cycle ('MONTHLY', 'QUARTERLY')
   - flat_type_rates_json TEXT (JSON mapping of flat_type and occupancy to monthly / quarterly rates)
"""
import sys, os, json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
)

def run_flat_type_and_tiered_billing_migration():
    print("Running Flat Type & Tiered Billing Migration...")
    with global_database_connection_manager.database_transaction_scope() as cur:
        # 1. Add flat_type to flats if not present
        cur.execute("SHOW COLUMNS FROM flats LIKE 'flat_type'")
        if not cur.fetchone():
            cur.execute("""
                ALTER TABLE flats
                ADD COLUMN flat_type VARCHAR(50) NOT NULL DEFAULT 'REGULAR' AFTER floor_number
            """)
            print(" -> Added `flat_type` column to `flats` table.")
        else:
            print(" -> `flat_type` column already exists in `flats`.")

        # Update top floors (e.g. 903, 904 or top floor) to PENTHOUSE if Shilp Serenity has penthouses
        cur.execute("""
            UPDATE flats
            SET flat_type = 'PENTHOUSE'
            WHERE floor_number >= 9 OR flat_number IN ('903', '904')
        """)

        # 2. Add columns to society_billing_configurations
        cur.execute("SHOW COLUMNS FROM society_billing_configurations LIKE 'billing_cycle'")
        if not cur.fetchone():
            cur.execute("""
                ALTER TABLE society_billing_configurations
                ADD COLUMN billing_cycle ENUM('MONTHLY', 'QUARTERLY') NOT NULL DEFAULT 'MONTHLY' AFTER calculation_mode,
                ADD COLUMN flat_type_rates_json TEXT NULL AFTER rate_per_sqft_inr
            """)
            print(" -> Added `billing_cycle` and `flat_type_rates_json` to `society_billing_configurations`.")
        else:
            print(" -> Tiered billing configuration columns already exist.")

        # 3. Modify calculation_mode ENUM in society_billing_configurations to include 'TIERED_FLAT_TYPE'
        cur.execute("""
            ALTER TABLE society_billing_configurations
            MODIFY COLUMN calculation_mode ENUM('FIXED_PER_FLAT', 'PER_SQFT_AREA', 'TIERED_FLAT_TYPE') NOT NULL DEFAULT 'FIXED_PER_FLAT'
        """)
        print(" -> Modified `calculation_mode` to support 'TIERED_FLAT_TYPE'.")

        # 4. Seed default tiered rates matching Shilp Serenity Circular
        default_tiered_rates = {
            "REGULAR": {
                "owner_monthly": 2400.00,
                "tenant_monthly": 3000.00,
                "owner_quarterly": 7200.00,
                "tenant_quarterly": 9000.00
            },
            "PENTHOUSE": {
                "owner_monthly": 2900.00,
                "tenant_monthly": 3500.00,
                "owner_quarterly": 8700.00,
                "tenant_quarterly": 10500.00
            },
            "2BHK": {
                "owner_monthly": 2000.00,
                "tenant_monthly": 2500.00,
                "owner_quarterly": 6000.00,
                "tenant_quarterly": 7500.00
            },
            "3BHK": {
                "owner_monthly": 2400.00,
                "tenant_monthly": 3000.00,
                "owner_quarterly": 7200.00,
                "tenant_quarterly": 9000.00
            },
            "4BHK": {
                "owner_monthly": 2800.00,
                "tenant_monthly": 3400.00,
                "owner_quarterly": 8400.00,
                "tenant_quarterly": 10200.00
            },
            "SHOP": {
                "owner_monthly": 1500.00,
                "tenant_monthly": 2000.00,
                "owner_quarterly": 4500.00,
                "tenant_quarterly": 6000.00
            }
        }

        rates_json_str = json.dumps(default_tiered_rates)
        cur.execute("""
            UPDATE society_billing_configurations
            SET flat_type_rates_json = %s
            WHERE flat_type_rates_json IS NULL OR flat_type_rates_json = ''
        """, (rates_json_str,))

        # Update society registration details from notice if blank
        cur.execute("""
            UPDATE societies
            SET registration_number = COALESCE(registration_number, 'REG/GNR/SA(HAA)19102/2024'),
                billing_address = COALESCE(billing_address, 'Near Shiva Blessing, Behind Swagat Flamingo, Sarkhej-Gandhinagar Highway, Sargasan, Gandhinagar - 382421')
            WHERE society_id = 1
        """)

        # Sync occupancy status in flats from users if available
        cur.execute("""
            UPDATE flats f
            JOIN users u ON u.flat_id = f.flat_id
            SET f.occupancy_status = CASE 
                WHEN u.resident_type = 'TENANT' THEN 'TENANT_OCCUPIED'
                ELSE 'OWNER_OCCUPIED'
            END
            WHERE u.is_active = 1
        """)

    print("Flat Type & Tiered Billing Migration finished successfully!")

if __name__ == "__main__":
    run_flat_type_and_tiered_billing_migration()
