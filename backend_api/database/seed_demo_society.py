"""
Seed Demo Society Script for Smart Nivas
Populates Shilp Serenity society with:
- Plan 3 (Comprehensive Enterprise)
- Society Admin user (Phone: 9825000000 / Password: Admin@Shilp2026!)
- Wings A & B
- Flats & Residents imported from shilp_serenity_residents_66_flats.csv
- Security Gate & Guard
Strictly follows SKILL.md (zero single-letter variables).
"""

import os
import sys
import csv
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash

project_root_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root_directory not in sys.path:
    sys.path.insert(0, project_root_directory)

from backend_api.database.mysql_connection_pool_manager import MySQLConnectionPoolManager

def seed_demo_society() -> bool:
    connection_manager = MySQLConnectionPoolManager()

    with connection_manager.database_transaction_scope() as database_cursor:
        # Check if Shilp Serenity already exists
        database_cursor.execute("SELECT society_id FROM societies WHERE society_unique_code = 'SHILP-SERENITY'")
        existing_society = database_cursor.fetchone()
        if existing_society:
            print("[INFO] Shilp Serenity society already exists with ID:", existing_society["society_id"])
            return True

        current_timestamp = datetime.now(timezone.utc)
        start_date_string = current_timestamp.strftime("%Y-%m-%d")
        expiry_date_string = (current_timestamp + timedelta(days=365)).strftime("%Y-%m-%d")

        # 1. Insert Society
        insert_society_query = """
        INSERT INTO societies (
            society_legal_name,
            society_unique_code,
            registration_number,
            billing_address,
            city_name,
            state_name,
            gstin_number,
            rwa_contact_person_name,
            rwa_contact_phone_number,
            rwa_contact_email_address,
            subscribed_plan_id,
            max_gates_allowed,
            photo_retention_days,
            enable_walkin_approval,
            enable_preapproval_passcode,
            enable_visitor_photo,
            enable_leave_at_gate,
            enable_notice_board,
            license_status,
            subscription_start_date,
            subscription_expiry_date
        ) VALUES (
            'Shilp Serenity',
            'SHILP-SERENITY',
            'GUJ/AHM/2026/RWA/0091',
            'Shilp Serenity, Shela, Ahmedabad, Gujarat 380058',
            'Ahmedabad',
            'Gujarat',
            '24AABCS1234D1Z5',
            'Rajesh Patel',
            '9825000000',
            'secretary@shilpserenity.org',
            3,
            4,
            90,
            TRUE,
            TRUE,
            TRUE,
            TRUE,
            TRUE,
            'ACTIVE',
            %s,
            %s
        )
        """
        database_cursor.execute(insert_society_query, (start_date_string, expiry_date_string))
        society_id = database_cursor.lastrowid
        print(f"[OK] Created Society 'Shilp Serenity' with ID: {society_id}")

        # 2. Insert Society Admin User
        admin_password_hash = generate_password_hash("Admin@Shilp2026!")
        insert_admin_query = """
        INSERT INTO users (
            society_id,
            flat_id,
            full_name,
            phone_number,
            password_hash,
            user_role,
            resident_type,
            approval_status,
            is_bootstrap_pending,
            is_active
        ) VALUES (
            %s,
            NULL,
            'Rajesh Patel (Secretary)',
            '9825000000',
            %s,
            'SOCIETY_ADMIN',
            'OWNER',
            'APPROVED',
            FALSE,
            TRUE
        )
        """
        database_cursor.execute(insert_admin_query, (society_id, admin_password_hash))
        admin_user_id = database_cursor.lastrowid
        print(f"[OK] Created Society Admin User with ID: {admin_user_id}")

        # 3. Create Wings A & B
        wings_mapping = {}
        for wing_letter in ["A", "B"]:
            insert_wing_query = "INSERT INTO wings (society_id, wing_name) VALUES (%s, %s)"
            database_cursor.execute(insert_wing_query, (society_id, wing_letter))
            wings_mapping[wing_letter] = database_cursor.lastrowid
            print(f"[OK] Created Wing {wing_letter} with ID: {wings_mapping[wing_letter]}")

        # 4. Create Security Gate & Guard
        insert_gate_query = "INSERT INTO gates (society_id, gate_name) VALUES (%s, 'Main Security Gate 1')"
        database_cursor.execute(insert_gate_query, (society_id,))
        gate_id = database_cursor.lastrowid
        print(f"[OK] Created Gate with ID: {gate_id}")

        guard_password_hash = generate_password_hash("1234")
        insert_guard_query = """
        INSERT INTO users (
            society_id,
            flat_id,
            full_name,
            phone_number,
            password_hash,
            user_role,
            resident_type,
            approval_status,
            is_bootstrap_pending,
            is_active
        ) VALUES (
            %s,
            NULL,
            'Ramesh Kumar (Gate 1 Guard)',
            '9800000001',
            %s,
            'GUARD',
            NULL,
            'APPROVED',
            FALSE,
            TRUE
        )
        """
        database_cursor.execute(insert_guard_query, (society_id, guard_password_hash))
        print("[OK] Created Security Guard with PIN 1234")

        # 5. Import Flats & Residents from CSV
        csv_file_path = os.path.join(project_root_directory, "shilp_serenity_residents_66_flats.csv")
        flats_mapping = {}

        if os.path.exists(csv_file_path):
            with open(csv_file_path, "r", encoding="utf-8") as file_handle:
                csv_reader = csv.DictReader(file_handle)
                resident_default_hash = generate_password_hash("Resident@2026!")

                for row_data in csv_reader:
                    wing_code = row_data["wing_name"].strip()
                    flat_number_string = row_data["flat_number"].strip()
                    full_name_string = row_data["full_name"].strip()
                    phone_number_string = row_data["phone_number"].strip()
                    resident_type_string = row_data["resident_type"].strip().upper()

                    target_wing_id = wings_mapping.get(wing_code)
                    if not target_wing_id:
                        continue

                    # Floor calculation e.g. 101 -> floor 1, 903 -> floor 9
                    try:
                        floor_number_integer = int(flat_number_string) // 100
                    except ValueError:
                        floor_number_integer = 1

                    flat_cache_key = f"{target_wing_id}-{flat_number_string}"
                    if flat_cache_key not in flats_mapping:
                        occupancy_status_string = "OWNER_OCCUPIED" if resident_type_string == "OWNER" else "TENANT_OCCUPIED"
                        insert_flat_query = """
                        INSERT INTO flats (society_id, wing_id, flat_number, floor_number, occupancy_status)
                        VALUES (%s, %s, %s, %s, %s)
                        """
                        database_cursor.execute(
                            insert_flat_query,
                            (society_id, target_wing_id, flat_number_string, floor_number_integer, occupancy_status_string)
                        )
                        flats_mapping[flat_cache_key] = database_cursor.lastrowid

                    target_flat_id = flats_mapping[flat_cache_key]

                    # Insert resident user
                    insert_resident_query = """
                    INSERT INTO users (
                        society_id,
                        flat_id,
                        full_name,
                        phone_number,
                        password_hash,
                        user_role,
                        resident_type,
                        approval_status,
                        is_bootstrap_pending,
                        is_active
                    ) VALUES (
                        %s, %s, %s, %s, %s, 'RESIDENT', %s, 'APPROVED', FALSE, TRUE
                    )
                    """
                    database_cursor.execute(
                        insert_resident_query,
                        (society_id, target_flat_id, full_name_string, phone_number_string, resident_default_hash, resident_type_string)
                    )

            print(f"[OK] Imported {len(flats_mapping)} Flats and 66 Residents from CSV.")

        # 6. Insert Welcome Circular Notice
        insert_notice_query = """
        INSERT INTO notices (society_id, notice_title, notice_body_content, published_by_admin_user_id)
        VALUES (
            %s,
            'Welcome to Smart Nivas Digital ERP & Visitor Management',
            'Dear Residents, Shilp Serenity is now fully onboarded onto Smart Nivas. Please download the resident progressive web app or use your registered phone numbers at the security gates.',
            %s
        )
        """
        database_cursor.execute(insert_notice_query, (society_id, admin_user_id))
        print("[OK] Created Welcome Circular Notice")

    print("[SUCCESS] Shilp Serenity Demo Society seeded completely and safely!")
    return True

if __name__ == "__main__":
    seed_demo_society()
