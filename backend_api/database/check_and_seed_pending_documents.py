import os
import sys
import pymysql
from werkzeug.security import generate_password_hash

project_root_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root_directory not in sys.path:
    sys.path.insert(0, project_root_directory)

from backend_api.environment_configuration import global_application_configuration

connection = pymysql.connect(
    host=global_application_configuration.mysql_database_host,
    port=global_application_configuration.mysql_database_port,
    user=global_application_configuration.mysql_database_user,
    password=global_application_configuration.mysql_database_password,
    database=global_application_configuration.mysql_database_name,
    charset="utf8mb4",
    autocommit=True,
)
cursor = connection.cursor()

# Get a flat in Wing A or B
cursor.execute("SELECT flat_id, wing_id, flat_number FROM flats WHERE flat_number = '101' LIMIT 1")
flat_101 = cursor.fetchone()
cursor.execute("SELECT flat_id, wing_id, flat_number FROM flats WHERE flat_number = '201' LIMIT 1")
flat_201 = cursor.fetchone()

password_hash = generate_password_hash("Resident@SmartNivas2026!", method="scrypt")

# Create or reset pending owner: Hardik Joshi (Owner) in Flat 101
cursor.execute("DELETE FROM users WHERE phone_number IN ('9825990001', '9825990002')")
cursor.execute(
    """
    INSERT INTO users (society_id, flat_id, full_name, phone_number, password_hash, user_role, resident_type, approval_status, is_active)
    VALUES (1, %s, 'Hardik Joshi', '9825990001', %s, 'RESIDENT', 'OWNER', 'PENDING', TRUE)
    """,
    (flat_101[0] if flat_101 else None, password_hash)
)
owner_user_id = cursor.lastrowid

# Attach Owner documents: Aadhaar Card, Flat Index Copy, Owner Photo
cursor.execute(
    """
    INSERT INTO resident_verification_documents (society_id, user_id, document_type, document_title, file_name, file_path_or_url, file_size_bytes)
    VALUES
    (1, %s, 'AADHAAR_CARD', 'Aadhaar Card (Front & Back)', 'hardik_joshi_aadhaar.pdf', 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqIDIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iaiAzIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTc4CiUlRU9G', 245000),
    (1, %s, 'FLAT_INDEX_COPY', 'Flat Index-II Registered Copy', 'hardik_flat101_index2_copy.pdf', 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqIDIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iaiAzIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTc4CiUlRU9G', 412000),
    (1, %s, 'OWNER_PHOTO', 'Owner Passport Photo', 'hardik_photo.jpg', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#e2e8f0"/><circle cx="100" cy="80" r="40" fill="#3b82f6"/><circle cx="100" cy="180" r="60" fill="#3b82f6"/></svg>', 52000)
    """,
    (owner_user_id, owner_user_id, owner_user_id)
)

# Create pending tenant: Neha Kapoor (Tenant) in Flat 201
cursor.execute(
    """
    INSERT INTO users (society_id, flat_id, full_name, phone_number, password_hash, user_role, resident_type, approval_status, is_active)
    VALUES (1, %s, 'Neha Kapoor', '9825990002', %s, 'RESIDENT', 'TENANT', 'PENDING', TRUE)
    """,
    (flat_201[0] if flat_201 else None, password_hash)
)
tenant_user_id = cursor.lastrowid

# Attach Tenant documents: Aadhaar Card, Rent Agreement, Police Verification
cursor.execute(
    """
    INSERT INTO resident_verification_documents (society_id, user_id, document_type, document_title, file_name, file_path_or_url, file_size_bytes)
    VALUES
    (1, %s, 'AADHAAR_CARD', 'Tenant Aadhaar Card', 'neha_aadhaar.pdf', 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqIDIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iaiAzIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTc4CiUlRU9G', 210000),
    (1, %s, 'RENT_AGREEMENT', '11-Month Notarized Rent Agreement', 'neha_flat201_rent_agreement.pdf', 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqIDIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iaiAzIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTc4CiUlRU9G', 680000),
    (1, %s, 'POLICE_VERIFICATION', 'Gujarat Police Tenant Verification Certificate', 'neha_police_verification_form.pdf', 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqIDIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iaiAzIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTc4CiUlRU9G', 320000)
    """,
    (tenant_user_id, tenant_user_id, tenant_user_id)
)

print(f"Created pending owner #{owner_user_id} (Hardik Joshi) and pending tenant #{tenant_user_id} (Neha Kapoor) with verification documents.")

cursor.close()
connection.close()
