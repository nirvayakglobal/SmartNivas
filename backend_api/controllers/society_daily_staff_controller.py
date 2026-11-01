"""
Smart Nivas - Society Daily Staff & Helper Controller
Flask Blueprint exposing REST endpoints for Daily Staff & Helper Management.
"""

from typing import Optional
from flask import Blueprint, request, jsonify, Response, g as flask_global_context
from backend_api.services.society_daily_staff_service import SocietyDailyStaffService
from backend_api.middlewares.jwt_authentication_middleware import (
    AuthenticatedUserContext,
)
from backend_api.middlewares.tenant_privacy_and_entitlement_middleware import (
    require_society_permission,
)


def create_society_daily_staff_blueprint(
    staff_service: Optional[SocietyDailyStaffService] = None,
) -> Blueprint:
    blueprint = Blueprint("society_daily_staff_controller", __name__)
    if staff_service is None:
        staff_service = SocietyDailyStaffService()

    require_admin_or_guard = require_society_permission(
        allowed_roles=["SOCIETY_ADMIN", "GATE_SECURITY_GUARD"]
    )
    require_admin_only = require_society_permission(
        allowed_roles=["SOCIETY_ADMIN"]
    )

    # ----------------------------------------------------
    # Configuration Endpoints
    # ----------------------------------------------------
    @blueprint.route("/config", methods=["GET"])
    @require_admin_only
    def get_staff_configuration():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        config = staff_service.get_staff_config(society_id)
        return jsonify({"success": True, "data": config}), 200

    @blueprint.route("/config", methods=["PUT"])
    @require_admin_only
    def update_staff_configuration():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        payload = request.get_json() or {}
        try:
            updated_config = staff_service.update_staff_config(society_id, payload)
            return (
                jsonify(
                    {
                        "success": True,
                        "data": updated_config,
                        "message": "Staff rules updated successfully.",
                    }
                ),
                200,
            )
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 400

    # ----------------------------------------------------
    # Staff Roster Endpoints
    # ----------------------------------------------------
    @blueprint.route("", methods=["GET"])
    @require_admin_or_guard
    def list_staff_roster():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        role_category = request.args.get("category", "ALL")
        status = request.args.get("status", "ALL")
        search = request.args.get("search", "")

        roster = staff_service.get_staff_roster(
            society_id=society_id,
            role_category=role_category,
            status=status,
            search_query=search,
        )
        return jsonify({"success": True, "data": roster, "count": len(roster)}), 200

    @blueprint.route("/<staff_id>", methods=["GET"])
    @require_admin_or_guard
    def get_staff_details(staff_id):
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        staff = staff_service.get_staff_detail(society_id, staff_id)
        if not staff:
            return jsonify({"success": False, "message": "Staff member not found."}), 404
        return jsonify({"success": True, "data": staff}), 200

    @blueprint.route("", methods=["POST"])
    @require_admin_only
    def register_new_staff():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        payload = request.get_json() or {}
        try:
            new_staff = staff_service.register_staff_member(society_id, payload)
            return (
                jsonify(
                    {
                        "success": True,
                        "data": new_staff,
                        "message": "Staff registered successfully.",
                    }
                ),
                201,
            )
        except ValueError as ve:
            return jsonify({"success": False, "message": str(ve)}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

    @blueprint.route("/<staff_id>", methods=["PUT"])
    @require_admin_only
    def update_staff_profile(staff_id):
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        payload = request.get_json() or {}
        try:
            updated_staff = staff_service.update_staff_member(society_id, staff_id, payload)
            return (
                jsonify(
                    {
                        "success": True,
                        "data": updated_staff,
                        "message": "Staff profile updated successfully.",
                    }
                ),
                200,
            )
        except ValueError as ve:
            return jsonify({"success": False, "message": str(ve)}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

    # ----------------------------------------------------
    # Blacklist & Unblacklist Actions
    # ----------------------------------------------------
    @blueprint.route("/<staff_id>/blacklist", methods=["POST"])
    @require_admin_only
    def blacklist_staff_member(staff_id):
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        admin_id = user_context.user_id
        admin_name = getattr(user_context, "full_name", None) or getattr(
            user_context, "username", "Society Admin"
        )

        payload = request.get_json() or {}
        reason = payload.get("reason", "")
        try:
            updated_staff = staff_service.blacklist_staff(
                society_id=society_id,
                staff_id=staff_id,
                reason=reason,
                admin_id=str(admin_id),
                admin_name=admin_name,
            )
            return (
                jsonify(
                    {
                        "success": True,
                        "data": updated_staff,
                        "message": "Staff member has been blacklisted and access revoked.",
                    }
                ),
                200,
            )
        except ValueError as ve:
            return jsonify({"success": False, "message": str(ve)}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

    @blueprint.route("/<staff_id>/unblacklist", methods=["POST"])
    @require_admin_only
    def unblacklist_staff_member(staff_id):
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        admin_id = user_context.user_id
        admin_name = getattr(user_context, "full_name", None) or getattr(
            user_context, "username", "Society Admin"
        )

        payload = request.get_json() or {}
        reason = payload.get("reason", "")
        try:
            updated_staff = staff_service.unblacklist_staff(
                society_id=society_id,
                staff_id=staff_id,
                reason=reason,
                admin_id=str(admin_id),
                admin_name=admin_name,
            )
            return (
                jsonify(
                    {
                        "success": True,
                        "data": updated_staff,
                        "message": "Staff member reinstated (set to Inactive pending review).",
                    }
                ),
                200,
            )
        except ValueError as ve:
            return jsonify({"success": False, "message": str(ve)}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

    # ----------------------------------------------------
    # Gate Attendance Actions & Real-Time Feed
    # ----------------------------------------------------
    @blueprint.route("/live-attendance", methods=["GET"])
    @require_admin_or_guard
    def get_live_attendance():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        feed = staff_service.get_live_attendance_feed(society_id)
        return jsonify({"success": True, "data": feed, "count": len(feed)}), 200

    @blueprint.route("/gate-checkin", methods=["POST"])
    @require_admin_or_guard
    def record_gate_entry():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        guard_id = user_context.user_id

        payload = request.get_json() or {}
        staff_id = payload.get("staff_id")
        entry_gate = payload.get("entry_gate", "Main Gate")
        remarks = payload.get("remarks")
        override_timing = bool(payload.get("override_timing", False))

        if not staff_id:
            return jsonify({"success": False, "message": "staff_id is required."}), 400

        try:
            entry_log = staff_service.log_gate_entry(
                society_id=society_id,
                staff_id=staff_id,
                entry_gate=entry_gate,
                guard_id=str(guard_id) if guard_id else None,
                remarks=remarks,
                override_timing=override_timing,
            )
            return (
                jsonify(
                    {
                        "success": True,
                        "data": entry_log,
                        "message": "Gate check-in recorded.",
                    }
                ),
                201,
            )
        except ValueError as ve:
            return jsonify({"success": False, "message": str(ve)}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

    @blueprint.route("/gate-checkout", methods=["POST"])
    @require_admin_or_guard
    def record_gate_exit():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        guard_id = user_context.user_id

        payload = request.get_json() or {}
        staff_id = payload.get("staff_id")
        exit_gate = payload.get("exit_gate", "Main Gate")
        remarks = payload.get("remarks")

        if not staff_id:
            return jsonify({"success": False, "message": "staff_id is required."}), 400

        try:
            exit_log = staff_service.log_gate_exit(
                society_id=society_id,
                staff_id=staff_id,
                exit_gate=exit_gate,
                guard_id=str(guard_id) if guard_id else None,
                remarks=remarks,
            )
            return (
                jsonify(
                    {
                        "success": True,
                        "data": exit_log,
                        "message": "Gate check-out recorded.",
                    }
                ),
                200,
            )
        except ValueError as ve:
            return jsonify({"success": False, "message": str(ve)}), 400
        except Exception as e:
            return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

    # ----------------------------------------------------
    # Reports & Exports
    # ----------------------------------------------------
    @blueprint.route("/reports/attendance-log", methods=["GET"])
    @require_admin_only
    def get_attendance_report():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        category = request.args.get("category", "ALL")
        export_format = request.args.get("format", "json")

        if export_format == "csv":
            csv_data = staff_service.export_attendance_csv(
                society_id, start_date, end_date, category
            )
            return Response(
                csv_data,
                mimetype="text/csv",
                headers={
                    "Content-Disposition": "attachment;filename=staff_attendance_log.csv"
                },
            )

        logs = staff_service.get_attendance_timesheet_report(
            society_id, start_date, end_date, category
        )
        return jsonify({"success": True, "data": logs, "count": len(logs)}), 200

    @blueprint.route("/reports/blacklist-audit", methods=["GET"])
    @require_admin_only
    def get_blacklist_audit():
        user_context: AuthenticatedUserContext = (
            flask_global_context.authenticated_user_context
        )
        society_id = user_context.society_id
        export_format = request.args.get("format", "json")

        if export_format == "csv":
            csv_data = staff_service.export_blacklist_audit_csv(society_id)
            return Response(
                csv_data,
                mimetype="text/csv",
                headers={
                    "Content-Disposition": "attachment;filename=staff_blacklist_audit_report.csv"
                },
            )

        audits = staff_service.get_blacklist_audit_report(society_id)
        return jsonify({"success": True, "data": audits, "count": len(audits)}), 200

    return blueprint
