"""
Environment Configuration Module for Smart Nivas (Niravayak Global)
Provides strongly-typed, centralized application configuration loaded from environment variables.
Follows SOLID principles and SKILL.md strict variable naming rules.
"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ApplicationEnvironmentConfiguration:
    # Flask runtime configuration
    flask_environment: str = os.environ.get("FLASK_ENV", "production")
    flask_secret_key: str = os.environ.get(
        "FLASK_SECRET_KEY", "niravayak-global-smart-nivas-session-secret-key-2026"
    )

    # JWT Authentication configuration
    jwt_secret_signature_key: str = os.environ.get(
        "JWT_SECRET_SIGNATURE_KEY",
        "niravayak-smart-nivas-jwt-token-cryptographic-signing-key-production-2026",
    )
    jwt_token_expiration_seconds: int = int(
        os.environ.get("JWT_TOKEN_EXPIRATION_SECONDS", "86400")
    )

    # MySQL Database connection configuration (Hostinger / Local)
    mysql_database_host: str = os.environ.get("MYSQL_DATABASE_HOST", "127.0.0.1")
    mysql_database_port: int = int(os.environ.get("MYSQL_DATABASE_PORT", "3306"))
    mysql_database_user: str = os.environ.get("MYSQL_DATABASE_USER", "root")
    mysql_database_password: str = os.environ.get("MYSQL_DATABASE_PASSWORD", "")
    mysql_database_name: str = os.environ.get(
        "MYSQL_DATABASE_NAME", "smart_nivas_production_db"
    )
    mysql_connection_pool_size: int = int(
        os.environ.get("MYSQL_CONNECTION_POOL_SIZE", "10")
    )

    # VAPID Web Push Notification configuration
    vapid_public_key: str = os.environ.get(
        "VAPID_PUBLIC_KEY", "niravayak_vapid_public_key_placeholder"
    )
    vapid_private_key: str = os.environ.get(
        "VAPID_PRIVATE_KEY", "niravayak_vapid_private_key_placeholder"
    )
    vapid_claim_email_address: str = os.environ.get(
        "VAPID_CLAIM_EMAIL_ADDRESS", "mailto:contact@niravayak.com"
    )

    # File uploads directory path
    visitor_photo_upload_directory: str = os.environ.get(
        "VISITOR_PHOTO_UPLOAD_DIRECTORY", "uploads/visitors"
    )


# Global singleton configuration instance
global_application_configuration = ApplicationEnvironmentConfiguration()
