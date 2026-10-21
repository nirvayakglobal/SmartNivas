"""
MySQL Connection Pool & ACID Transaction Manager for Smart Nivas
Implements robust connection handling and database_transaction_scope()
with explicit begin(), commit(), and rollback() semantics.
Follows SOLID principles and strict variable naming standards.
"""

from contextlib import contextmanager
from typing import Generator, Any
import pymysql
from pymysql.cursors import DictCursor

from backend_api.environment_configuration import (
    global_application_configuration,
    ApplicationEnvironmentConfiguration,
)


class MySQLConnectionPoolManager:
    """
    Manages direct connections and transactional scopes for MySQL InnoDB database operations.
    Can be instantiated with a custom configuration or default global configuration.
    """

    def __init__(
        self,
        application_configuration: ApplicationEnvironmentConfiguration = global_application_configuration,
    ) -> None:
        self._application_configuration: ApplicationEnvironmentConfiguration = (
            application_configuration
        )

    def create_database_connection(self) -> pymysql.Connection:
        """
        Creates a raw pymysql connection configured with DictCursor and autocommit=False.
        """
        database_connection: pymysql.Connection = pymysql.connect(
            host=self._application_configuration.mysql_database_host,
            port=self._application_configuration.mysql_database_port,
            user=self._application_configuration.mysql_database_user,
            password=self._application_configuration.mysql_database_password,
            database=self._application_configuration.mysql_database_name,
            charset="utf8mb4",
            cursorclass=DictCursor,
            autocommit=False,
        )
        return database_connection

    @contextmanager
    def database_transaction_scope(
        self,
    ) -> Generator[DictCursor, None, None]:
        """
        ACID Transaction Context Manager.
        Explicitly begins transaction, provides DictCursor to caller,
        commits on clean exit, and performs complete rollback on any exception.
        """
        active_database_connection: pymysql.Connection = (
            self.create_database_connection()
        )
        active_database_cursor: DictCursor = active_database_connection.cursor()
        try:
            active_database_connection.begin()
            yield active_database_cursor
            active_database_connection.commit()
        except Exception as transaction_runtime_exception:
            active_database_connection.rollback()
            raise transaction_runtime_exception
        finally:
            active_database_cursor.close()
            active_database_connection.close()

    @contextmanager
    def database_read_scope(
        self,
    ) -> Generator[DictCursor, None, None]:
        """
        Read-only query context manager for non-transactional or read-only queries.
        Automatically closes cursor and connection.
        """
        active_database_connection: pymysql.Connection = (
            self.create_database_connection()
        )
        active_database_cursor: DictCursor = active_database_connection.cursor()
        try:
            yield active_database_cursor
        finally:
            active_database_cursor.close()
            active_database_connection.close()


# Global singleton connection pool manager instance
global_database_connection_manager = MySQLConnectionPoolManager()


def database_transaction_scope() -> Generator[DictCursor, None, None]:
    """
    Convenience wrapper providing global transactional cursor context.
    Usage:
        with database_transaction_scope() as database_cursor:
            database_cursor.execute(...)
    """
    return global_database_connection_manager.database_transaction_scope()


def database_read_scope() -> Generator[DictCursor, None, None]:
    """
    Convenience wrapper providing global read-only cursor context.
    """
    return global_database_connection_manager.database_read_scope()
