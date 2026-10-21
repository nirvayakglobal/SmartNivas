"""
Tenant Privacy and Entitlement Enforcement Middleware for Smart Nivas
Guarantees the strict privacy wall:
1. Blocks SUPER_ADMIN from accessing private society operational endpoints (HTTP 403).
2. Restricts endpoint execution to allowed roles (SOCIETY_ADMIN, GUARD, RESIDENT, SUPER_ADMIN).
3. Verifies that the tenant society has an active license and the requested feature entitlement flag enabled.
"""

from functools import wraps
from typing import Any, Callable, List, Optional, Dict
from flask import jsonify, g as flask_global_context

from backend_api.middlewares.jwt_authentication_middleware import (
    require_jwt_authentication,
    AuthenticatedUserContext,
)
from backend_api.database.mysql_connection_pool_manager import database_read_scope


def require_super_admin(
    endpoint_handler_function: Callable[..., Any],
) -> Callable[..., Any]:
    """
    Decorator for Niravayak Central CRM commercial routes (/api/central/*).
    Strictly permits only SUPER_ADMIN role.
    """

    @wraps(endpoint_handler_function)
    @require_jwt_authentication
    def decorated_super_admin_wrapper(*positional_arguments, **keyword_arguments):
        authenticated_user: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )

        if authenticated_user.user_role != "SUPER_ADMIN":
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "FORBIDDEN_CENTRAL_CRM_ACCESS",
                        "message": "Only Niravayak Global Super Administrators can access Central CRM endpoints.",
                    }
                ),
                403,
            )

        return endpoint_handler_function(*positional_arguments, **keyword_arguments)

    return decorated_super_admin_wrapper


def require_society_permission(
    allowed_roles: List[str],
    required_feature_flag: Optional[str] = None,
) -> Callable[..., Any]:
    """
    Decorator enforcing:
    1. STRICT PRIVACY WALL: SUPER_ADMIN is categorically blocked (HTTP 403) from society data.
    2. Role Authorization: User role must be present in allowed_roles.
    3. Active License Verification: Society license_status cannot be SUSPENDED.
    4. Feature Entitlement: If required_feature_flag is specified, society must have it set to TRUE.
    """

    def decorator_generator(
        endpoint_handler_function: Callable[..., Any],
    ) -> Callable[..., Any]:
        @wraps(endpoint_handler_function)
        @require_jwt_authentication
        def decorated_society_permission_wrapper(*positional_arguments, **keyword_arguments):
            authenticated_user: AuthenticatedUserContext = (
                flask_global_context.authenticated_user_context
            )

            # Strict Privacy Wall: Super admin cannot view or mutate private society operational data
            if authenticated_user.user_role == "SUPER_ADMIN":
                return (
                    jsonify(
                        {
                            "success": False,
                            "error_code": "PRIVACY_WALL_RESTRICTION",
                            "message": "Access Denied: Niravayak Global Super Admins are strictly prohibited from accessing private society operations, flats, residents, or gate logs.",
                        }
                    ),
                    403,
                )

            # Role verification
            if authenticated_user.user_role not in allowed_roles:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error_code": "UNAUTHORIZED_ROLE_ACCESS",
                            "message": f"User role '{authenticated_user.user_role}' is not authorized for this resource. Required roles: {allowed_roles}",
                        }
                    ),
                    403,
                )

            # Society ID must be present for any society-level operation
            if not authenticated_user.society_id:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error_code": "MISSING_SOCIETY_AFFILIATION",
                            "message": "User account is not bound to a registered society tenant.",
                        }
                    ),
                    403,
                )

            # Fetch society licensing and entitlement status
            query_society_entitlements_sql: str = (
                "SELECT society_id, license_status, "
                "enable_walkin_approval, enable_preapproval_passcode, "
                "enable_visitor_photo, enable_leave_at_gate, enable_notice_board "
                "FROM societies WHERE society_id = %s"
            )

            with database_read_scope() as database_cursor:
                database_cursor.execute(
                    query_society_entitlements_sql,
                    (authenticated_user.society_id,),
                )
                society_entitlement_record: Optional[Dict[str, Any]] = (
                    database_cursor.fetchone()
                )

            if not society_entitlement_record:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error_code": "SOCIETY_NOT_FOUND",
                            "message": "Society tenant record could not be found.",
                        }
                    ),
                    404,
                )

            # Check license status
            license_status: str = society_entitlement_record.get("license_status", "SUSPENDED")
            if license_status == "SUSPENDED":
                return (
                    jsonify(
                        {
                            "success": False,
                            "error_code": "SOCIETY_LICENSE_SUSPENDED",
                            "message": "Society subscription license is suspended. Please contact Niravayak Global sales.",
                        }
                    ),
                    403,
                )

            # Check specific feature entitlement flag if requested
            if required_feature_flag:
                is_feature_flag_active: bool = bool(
                    society_entitlement_record.get(required_feature_flag, False)
                )
                if not is_feature_flag_active:
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error_code": "FEATURE_ENTITLEMENT_DISABLED",
                                "message": f"Feature '{required_feature_flag}' is not included or enabled in your society subscription plan.",
                            }
                        ),
                        403,
                    )

            # Store society entitlements in request context for downstream services
            flask_global_context.society_entitlement_record = society_entitlement_record

            return endpoint_handler_function(*positional_arguments, **keyword_arguments)

        return decorated_society_permission_wrapper

    return decorator_generator
