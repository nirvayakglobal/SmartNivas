"""
JWT Authentication Middleware for Smart Nivas
Provides JWT token generation, cryptographic validation, and request decoration.
Stores the authenticated user context in Flask's request-scoped 'g' object.
"""

from functools import wraps
from typing import Any, Callable, Dict, Optional
from datetime import datetime, timezone, timedelta
import jwt
from flask import request, jsonify, g as flask_global_context

from backend_api.environment_configuration import (
    global_application_configuration,
    ApplicationEnvironmentConfiguration,
)


class AuthenticatedUserContext:
    """
    Immutable representation of the authenticated user decoded from JWT.
    """

    def __init__(
        self,
        user_id: int,
        society_id: Optional[int],
        flat_id: Optional[int],
        user_role: str,
        phone_number: str,
        full_name: str,
    ) -> None:
        self.user_id: int = user_id
        self.society_id: Optional[int] = society_id
        self.flat_id: Optional[int] = flat_id
        self.user_role: str = user_role
        self.phone_number: str = phone_number
        self.full_name: str = full_name

    def to_dictionary(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "society_id": self.society_id,
            "flat_id": self.flat_id,
            "user_role": self.user_role,
            "phone_number": self.phone_number,
            "full_name": self.full_name,
        }


def generate_jwt_access_token(
    user_id: int,
    society_id: Optional[int],
    flat_id: Optional[int],
    user_role: str,
    phone_number: str,
    full_name: str,
    application_configuration: ApplicationEnvironmentConfiguration = global_application_configuration,
) -> str:
    """
    Encodes and signs a JSON Web Token containing authenticated user claims.
    """
    current_utc_timestamp: datetime = datetime.now(timezone.utc)
    token_expiration_timestamp: datetime = current_utc_timestamp + timedelta(
        seconds=application_configuration.jwt_token_expiration_seconds
    )

    token_payload_claims: Dict[str, Any] = {
        "sub": str(user_id),
        "user_id": user_id,
        "society_id": society_id,
        "flat_id": flat_id,
        "user_role": user_role,
        "phone_number": phone_number,
        "full_name": full_name,
        "iat": int(current_utc_timestamp.timestamp()),
        "exp": int(token_expiration_timestamp.timestamp()),
    }

    encoded_jwt_token_string: str = jwt.encode(
        payload=token_payload_claims,
        key=application_configuration.jwt_secret_signature_key,
        algorithm="HS256",
    )
    return encoded_jwt_token_string


def decode_and_verify_jwt_token(
    encoded_jwt_token_string: str,
    application_configuration: ApplicationEnvironmentConfiguration = global_application_configuration,
) -> AuthenticatedUserContext:
    """
    Decodes and validates cryptographic signature and expiration of JWT string.
    Raises jwt.PyJWTError if invalid or expired.
    """
    decoded_token_claims: Dict[str, Any] = jwt.decode(
        jwt=encoded_jwt_token_string,
        key=application_configuration.jwt_secret_signature_key,
        algorithms=["HS256"],
    )

    return AuthenticatedUserContext(
        user_id=int(decoded_token_claims["user_id"]),
        society_id=(
            int(decoded_token_claims["society_id"])
            if decoded_token_claims.get("society_id") is not None
            else None
        ),
        flat_id=(
            int(decoded_token_claims["flat_id"])
            if decoded_token_claims.get("flat_id") is not None
            else None
        ),
        user_role=str(decoded_token_claims["user_role"]),
        phone_number=str(decoded_token_claims["phone_number"]),
        full_name=str(decoded_token_claims["full_name"]),
    )


def require_jwt_authentication(
    endpoint_handler_function: Callable[..., Any],
) -> Callable[..., Any]:
    """
    Flask route decorator that validates Authorization: Bearer <token>
    and sets g.authenticated_user_context.
    """

    @wraps(endpoint_handler_function)
    def decorated_authentication_wrapper(*positional_arguments, **keyword_arguments):
        authorization_header_value: Optional[str] = request.headers.get("Authorization")
        if not authorization_header_value:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "MISSING_AUTHORIZATION_HEADER",
                        "message": "Authorization header with Bearer token is required.",
                    }
                ),
                401,
            )

        authorization_header_parts = authorization_header_value.strip().split(" ")
        if len(authorization_header_parts) != 2 or authorization_header_parts[0] != "Bearer":
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "INVALID_AUTHORIZATION_FORMAT",
                        "message": "Authorization header format must be 'Bearer <token>'.",
                    }
                ),
                401,
            )

        extracted_jwt_token_string: str = authorization_header_parts[1]
        try:
            authenticated_user_context: AuthenticatedUserContext = (
                decode_and_verify_jwt_token(extracted_jwt_token_string)
            )
            flask_global_context.authenticated_user_context = authenticated_user_context
        except jwt.ExpiredSignatureError:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "EXPIRED_AUTHENTICATION_TOKEN",
                        "message": "Authentication token has expired. Please log in again.",
                    }
                ),
                401,
            )
        except jwt.PyJWTError:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "INVALID_AUTHENTICATION_TOKEN",
                        "message": "Authentication token signature is invalid.",
                    }
                ),
                401,
            )

        return endpoint_handler_function(*positional_arguments, **keyword_arguments)

    return decorated_authentication_wrapper
