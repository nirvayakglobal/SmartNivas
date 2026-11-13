import os
import sys
import pymysql

project_root_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root_directory not in sys.path:
    sys.path.insert(0, project_root_directory)

from backend_api.environment_configuration import global_application_configuration

def create_resident_verification_documents_table():
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
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS resident_verification_documents (
        document_id INT AUTO_INCREMENT PRIMARY KEY,
        society_id INT NOT NULL,
        user_id INT NOT NULL,
        document_type ENUM(
            'AADHAAR_CARD',
            'FLAT_INDEX_COPY',
            'OWNER_PHOTO',
            'RENT_AGREEMENT',
            'POLICE_VERIFICATION',
            'OTHER'
        ) NOT NULL,
        document_title VARCHAR(150) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path_or_url LONGTEXT NOT NULL,
        file_size_bytes INT NULL,
        uploaded_by_user_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_doc_society_user (society_id, user_id),
        CONSTRAINT fk_doc_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
        CONSTRAINT fk_doc_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """
    cursor.execute(create_table_sql)
    print("Table 'resident_verification_documents' created or already exists.")
    cursor.close()
    connection.close()

if __name__ == "__main__":
    create_resident_verification_documents_table()
