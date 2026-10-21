"""
Authentication and Bootstrap Service for Smart Nivas
Business Logic Layer (Single Responsibility Principle) orchestrating authentication,
password verification/hashing, and atomic zero-knowledge Society Admin bootstrap activation.
Follows SOLID principles (DIP constructor injection), ACID principles, and SKILL.md standards.
"""

from typing import Any, Dict, Optional, Tuple
from werkzeug.security import generate_password_hash, check_password_hash

from backend_api.repositories.society_topology_and_user_repository import (
    SocietyTopologyAndUserRepository,
)
from backend_api.database.mysql_connection_pool_manager import (
    MySQLConnectionPoolManager,
    global_database_connection_manager,
)
from backend_api.middlewares.jwt_authentication_middleware import (
    generate_jwt_access_token,
)


class AuthenticationAndBootstrapService:
    """
    Service responsible for user credential verification and bootstrap onboarding.
    Dependencies are injected via constructor to uphold Dependency Inversion Principle.
    """

    def __init__(
        self,
        society_topology_repository: SocietyTopologyAndUserRepository,
        database_connection_manager: MySQLConnectionPoolManager = global_database_connection_manager,
    ) -> None:
        self._society_topology_repository: SocietyTopologyAndUserRepository = (
            society_topology_repository
        )
        self._database_connection_manager: MySQLConnectionPoolManager = (
            database_connection_manager
        )

    def authenticate_user_credentials(
        self,
        phone_number: str,
        plaintext_password: str,
        society_unique_code: Optional[str] = None,
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Validates login credentials.
        Returns:
            Tuple[bool, str, Optional[Dict[str, Any]]]:
            (is_successful, response_message_or_error, response_payload_dictionary)
        """
        normalized_phone_number: str = phone_number.strip()

        with self._database_connection_manager.database_read_scope() as database_cursor:
            target_society_id: Optional[int] = None

            # If a society code was supplied, resolve it first
            if society_unique_code:
                society_record: Optional[Dict[str, Any]] = (
                    self._society_topology_repository.find_society_by_unique_code(
                        database_cursor=database_cursor,
                        society_unique_code=society_unique_code.strip().upper(),
                    )
                )
                if not society_record:
                    return False, "Invalid society unique code specified.", None
                target_society_id = society_record["society_id"]

            matching_user_records = (
                self._society_topology_repository.find_user_by_phone_number_and_optional_society(
                    database_cursor=database_cursor,
                    phone_number=normalized_phone_number,
                    society_id=target_society_id,
                )
            )

            if not matching_user_records:
                return False, "Invalid phone number or password.", None

            # Find matching active user record with correct password
            authenticated_user_record: Optional[Dict[str, Any]] = None
            for candidate_user_record in matching_user_records:
                stored_password_hash: str = candidate_user_record["password_hash"]
                if check_password_hash(stored_password_hash, plaintext_password):
                    authenticated_user_record = candidate_user_record
                    break

            if not authenticated_user_record:
                return False, "Invalid phone number or password.", None

            # Verify account status
            if not authenticated_user_record["is_active"]:
                return False, "This user account has been deactivated.", None

            if authenticated_user_record["approval_status"] != "APPROVED":
                return (
                    False,
                    f"Account access is pending approval (Status: {authenticated_user_record['approval_status']}).",
                    None,
                )

            if authenticated_user_record["is_bootstrap_pending"]:
                return (
                    False,
                    "Account activation is pending. Please complete initial setup using your activation link.",
                    None,
                )

            # Check society licensing status for non-super-admin users
            society_details: Optional[Dict[str, Any]] = None
            if authenticated_user_record["society_id"] is not None:
                society_details = self._society_topology_repository.find_society_by_id(
                    database_cursor=database_cursor,
                    society_id=authenticated_user_record["society_id"],
                )
                if society_details and society_details.get("license_status") == "SUSPENDED":
                    return (
                        False,
                        "Society subscription license is currently suspended. Access denied.",
                        None,
                    )

        # Generate JWT access token
        jwt_access_token: str = generate_jwt_access_token(
            user_id=authenticated_user_record["user_id"],
            society_id=authenticated_user_record["society_id"],
            flat_id=authenticated_user_record["flat_id"],
            user_role=authenticated_user_record["user_role"],
            phone_number=authenticated_user_record["phone_number"],
            full_name=authenticated_user_record["full_name"],
        )

        response_payload: Dict[str, Any] = {
            "access_token": jwt_access_token,
            "token_type": "Bearer",
            "user": {
                "user_id": authenticated_user_record["user_id"],
                "full_name": authenticated_user_record["full_name"],
                "phone_number": authenticated_user_record["phone_number"],
                "user_role": authenticated_user_record["user_role"],
                "society_id": authenticated_user_record["society_id"],
                "flat_id": authenticated_user_record["flat_id"],
            },
            "society": society_details,
        }

        return True, "Authentication successful.", response_payload

    def activate_society_admin_via_bootstrap_token(
        self,
        bootstrap_activation_token: str,
        new_plaintext_password: str,
        full_name: Optional[str] = None,
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Activates a bootstrap-pending Society Admin account atomically inside ACID transaction.
        Enforces password strength and verifies token validity.
        """
        if len(new_plaintext_password.strip()) < 8:
            return False, "Password must be at least 8 characters in length.", None

        new_password_hash: str = generate_password_hash(
            new_plaintext_password,
            method="scrypt",
        )

        with self._database_connection_manager.database_transaction_scope() as database_cursor:
            pending_user_record: Optional[Dict[str, Any]] = (
                self._society_topology_repository.find_user_by_bootstrap_token(
                    database_cursor=database_cursor,
                    bootstrap_activation_token=bootstrap_activation_token.strip(),
                )
            )

            if not pending_user_record:
                return (
                    False,
                    "Invalid or expired bootstrap activation token.",
                    None,
                )

            target_user_id: int = pending_user_record["user_id"]
            updated_full_name: Optional[str] = (
                full_name.strip() if full_name and full_name.strip() else None
            )

            affected_row_count: int = (
                self._society_topology_repository.activate_society_admin_user(
                    database_cursor=database_cursor,
                    user_id=target_user_id,
                    password_hash=new_password_hash,
                    full_name=updated_full_name,
                )
            )

            if affected_row_count == 0:
                return (
                    False,
                    "Account activation failed or token was already consumed.",
                    None,
                )

            # Retrieve active user record post-update
            activated_user_record: Optional[Dict[str, Any]] = (
                self._society_topology_repository.find_user_by_id(
                    database_cursor=database_cursor,
                    user_id=target_user_id,
                )
            )

            society_details: Optional[Dict[str, Any]] = None
            if activated_user_record and activated_user_record["society_id"]:
                society_details = self._society_topology_repository.find_society_by_id(
                    database_cursor=database_cursor,
                    society_id=activated_user_record["society_id"],
                )

        if not activated_user_record:
            return False, "Failed to retrieve activated user record.", None

        # Generate fresh JWT token for immediate access
        jwt_access_token: str = generate_jwt_access_token(
            user_id=activated_user_record["user_id"],
            society_id=activated_user_record["society_id"],
            flat_id=activated_user_record["flat_id"],
            user_role=activated_user_record["user_role"],
            phone_number=activated_user_record["phone_number"],
            full_name=activated_user_record["full_name"],
        )

        response_payload: Dict[str, Any] = {
            "access_token": jwt_access_token,
            "token_type": "Bearer",
            "user": {
                "user_id": activated_user_record["user_id"],
                "full_name": activated_user_record["full_name"],
                "phone_number": activated_user_record["phone_number"],
                "user_role": activated_user_record["user_role"],
                "society_id": activated_user_record["society_id"],
                "flat_id": activated_user_record["flat_id"],
            },
            "society": society_details,
        }

        return True, "Society Admin account activated successfully.", response_payload
