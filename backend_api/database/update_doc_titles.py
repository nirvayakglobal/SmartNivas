import os
import sys
import pymysql

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
cursor.execute("UPDATE resident_verification_documents SET document_title = 'Registered Flat Index Copy' WHERE document_type = 'FLAT_INDEX_COPY'")
print("Updated records count:", cursor.rowcount)
cursor.close()
connection.close()
