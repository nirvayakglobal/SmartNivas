"""
Society Helpdesk & Complaint Management Controller
Exposes REST endpoints under /api/admin/helpdesk for Kanban boards, ticket detail views,
quick assign inline dropdowns, SLA category configuration, and analytical reports.
Strictly follows Clean Architecture and RBAC with @require_society_permission.
"""

from typing import Any, Dict, Optional
from flask import Blueprint, request, jsonify, g as flask_global_context

from backend_api.services.society_helpdesk_service import SocietyHelpdeskService
from backend_api.middlewares.jwt_authentication_middleware import (
    AuthenticatedUserContext,
)
from backend_api.middlewares.tenant_privacy_and_entitlement_middleware import (
    require_society_permission,
)


def create_society_helpdesk_blueprint(
    helpdesk_service: Optional[SocietyHelpdeskService] = None,
) -> Blueprint:
    blueprint = Blueprint("society_helpdesk_controller", __name__)
    if helpdesk_service is None:
        helpdesk_service = SocietyHelpdeskService()

    require_admin = require_society_permission(allowed_roles=["SOCIETY_ADMIN"])

    # -------------------------------------------------------------------------
    # Categories & SLA Configuration Endpoints
    # -------------------------------------------------------------------------

    @blueprint.route("/categories", methods=["GET"])
    @require_admin
    def handle_get_categories():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        try:
            categories = helpdesk_service.get_categories(user_context.society_id)
            return jsonify({"success": True, "categories": categories}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @blueprint.route("/categories", methods=["POST"])
    @require_admin
    def handle_create_category():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        payload = request.get_json() or {}

        required_fields = ["category_name", "sla_resolution_hours"]
        missing_fields = [f for f in required_fields if f not in payload]
        if missing_fields:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_message": f"Missing required fields: {missing_fields}",
                    }
                ),
                400,
            )

        try:
            category = helpdesk_service.create_category(
                society_id=user_context.society_id,
                category_name=payload["category_name"],
                description=payload.get("description", ""),
                sla_resolution_hours=payload["sla_resolution_hours"],
                icon_name=payload.get("icon_name", "Wrench"),
                badge_color=payload.get("badge_color", "blue"),
            )
            return jsonify({"success": True, "category": category}), 201
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @blueprint.route("/categories/<category_id>", methods=["PUT"])
    @require_admin
    def handle_update_category(category_id: str):
        payload = request.get_json() or {}
        try:
            category = helpdesk_service.update_category(
                category_id=category_id,
                category_name=payload.get("category_name", ""),
                description=payload.get("description", ""),
                sla_resolution_hours=payload.get("sla_resolution_hours", 24),
                icon_name=payload.get("icon_name", "Wrench"),
                badge_color=payload.get("badge_color", "blue"),
                is_active=payload.get("is_active", True),
            )
            if not category:
                return (
                    jsonify({"success": False, "error_message": "Category not found"}),
                    404,
                )
            return jsonify({"success": True, "category": category}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    # -------------------------------------------------------------------------
    # Tickets Listing & Creation Endpoints
    # -------------------------------------------------------------------------

    @blueprint.route("/tickets", methods=["GET"])
    @require_admin
    def handle_list_tickets():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        status_filter = request.args.get("status")
        category_filter = request.args.get("category_id")
        wing_filter = request.args.get("wing")
        search_query = request.args.get("search")

        try:
            tickets = helpdesk_service.list_tickets(
                society_id=user_context.society_id,
                status_filter=status_filter,
                category_filter=category_filter,
                wing_filter=wing_filter,
                search_query=search_query,
            )
            return (
                jsonify(
                    {"success": True, "tickets": tickets, "count": len(tickets)}
                ),
                200,
            )
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @blueprint.route("/tickets", methods=["POST"])
    @require_admin
    def handle_create_ticket():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        payload = request.get_json() or {}

        required_fields = [
            "category_id",
            "wing_name",
            "flat_number",
            "resident_name",
            "title",
            "description",
        ]
        missing_fields = [f for f in required_fields if f not in payload]
        if missing_fields:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_message": f"Missing required fields: {missing_fields}",
                    }
                ),
                400,
            )

        try:
            ticket = helpdesk_service.create_ticket(
                society_id=user_context.society_id,
                category_id=payload["category_id"],
                wing_name=payload["wing_name"],
                flat_number=payload["flat_number"],
                resident_name=payload["resident_name"],
                resident_phone=payload.get("resident_phone", ""),
                title=payload["title"],
                description=payload["description"],
                priority=payload.get("priority", "MEDIUM"),
                attachments=payload.get("attachments", []),
                flat_id=payload.get("flat_id"),
                resident_id=payload.get("resident_id"),
                assigned_to_type=payload.get("assigned_to_type", "UNASSIGNED"),
                assigned_to_id=payload.get("assigned_to_id"),
                assigned_to_name=payload.get("assigned_to_name"),
            )
            return jsonify({"success": True, "ticket": ticket}), 201
        except Exception as error:
            return jsonify({"success": False, "error_message": str(error)}), 400

    @blueprint.route("/tickets/<ticket_id>", methods=["GET"])
    @require_admin
    def handle_get_ticket_details(ticket_id: str):
        try:
            ticket = helpdesk_service.get_ticket_details(ticket_id)
            if not ticket:
                return (
                    jsonify({"success": False, "error_message": "Ticket not found"}),
                    404,
                )
            return jsonify({"success": True, "ticket": ticket}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @blueprint.route("/tickets/<ticket_id>/status", methods=["PUT"])
    @require_admin
    def handle_update_ticket_status(ticket_id: str):
        payload = request.get_json() or {}
        new_status = payload.get("status")
        if not new_status:
            return (
                jsonify({"success": False, "error_message": "New status is required"}),
                400,
            )

        try:
            ticket = helpdesk_service.update_ticket_status(ticket_id, new_status)
            if not ticket:
                return (
                    jsonify({"success": False, "error_message": "Ticket not found"}),
                    404,
                )
            return jsonify({"success": True, "ticket": ticket}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @blueprint.route("/tickets/<ticket_id>/assign", methods=["PUT"])
    @require_admin
    def handle_assign_ticket(ticket_id: str):
        payload = request.get_json() or {}
        assigned_to_type = payload.get("assigned_to_type", "STAFF")
        assigned_to_id = payload.get("assigned_to_id")
        assigned_to_name = payload.get("assigned_to_name")

        if not assigned_to_name or not assigned_to_id:
            return (
                jsonify(
                    {
                        "success": False,
                        "error_message": "Assignee name and ID are required",
                    }
                ),
                400,
            )

        try:
            ticket = helpdesk_service.assign_ticket(
                ticket_id=ticket_id,
                assigned_to_type=assigned_to_type,
                assigned_to_id=assigned_to_id,
                assigned_to_name=assigned_to_name,
            )
            if not ticket:
                return (
                    jsonify({"success": False, "error_message": "Ticket not found"}),
                    404,
                )
            return jsonify({"success": True, "ticket": ticket}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    # -------------------------------------------------------------------------
    # Internal Notes & Chat Thread
    # -------------------------------------------------------------------------

    @blueprint.route("/tickets/<ticket_id>/notes", methods=["POST"])
    @require_admin
    def handle_add_ticket_note(ticket_id: str):
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        payload = request.get_json() or {}
        note_text = payload.get("note_text")
        if not note_text or not note_text.strip():
            return (
                jsonify({"success": False, "error_message": "Note text is required"}),
                400,
            )

        author_name = payload.get("author_name") or "Society Admin"
        author_id = str(user_context.user_id)
        author_role = getattr(user_context, "role_name", "ADMIN")
        is_internal = payload.get("is_internal", True)

        try:
            note = helpdesk_service.add_internal_note(
                ticket_id=ticket_id,
                author_id=author_id,
                author_name=author_name,
                author_role=author_role,
                note_text=note_text,
                is_internal=is_internal,
            )
            return jsonify({"success": True, "note": note}), 201
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    # -------------------------------------------------------------------------
    # Assignees Directory Helper (Staff + Registered Vendors)
    # -------------------------------------------------------------------------

    @blueprint.route("/assignees", methods=["GET"])
    @require_admin
    def handle_get_assignees():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        try:
            assignees = helpdesk_service.get_assignees(user_context.society_id)
            return jsonify({"success": True, "assignees": assignees}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    # -------------------------------------------------------------------------
    # Reports & Analytics Endpoints
    # -------------------------------------------------------------------------

    @blueprint.route("/reports/tat", methods=["GET"])
    @require_admin
    def handle_get_tat_report():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        try:
            tat_data = helpdesk_service.get_tat_analytics(user_context.society_id)
            return jsonify({"success": True, "tat_analytics": tat_data}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    @blueprint.route("/reports/trends", methods=["GET"])
    @require_admin
    def handle_get_trends_report():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        try:
            trend_data = helpdesk_service.get_volume_trend_analytics(
                user_context.society_id
            )
            return jsonify({"success": True, "trend_analytics": trend_data}), 200
        except Exception as server_error:
            return jsonify({"success": False, "error_message": str(server_error)}), 500

    return blueprint
