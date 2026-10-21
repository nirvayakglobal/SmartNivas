"""
Application Factory for Smart Nivas (Niravayak Global)
Initializes Flask application, registers blueprints, configures CORS,
error handling, and serves compiled static bundles for:
  - web_application: /central and /admin
  - mobile_application: /guard and /member
"""

import os
import mimetypes
from typing import Optional
from flask import Flask, jsonify, send_from_directory, request

# Ensure Windows registry doesn't misidentify JavaScript as text/plain
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/json", ".json")

from backend_api.environment_configuration import (
    global_application_configuration,
    ApplicationEnvironmentConfiguration,
)
from backend_api.controllers.authentication_controller import (
    create_authentication_blueprint,
)
from backend_api.controllers.niravayak_central_crm_controller import (
    create_niravayak_central_crm_blueprint,
)
from backend_api.controllers.society_admin_portal_controller import (
    create_society_admin_portal_blueprint,
)


def create_smart_nivas_flask_application(
    application_configuration: ApplicationEnvironmentConfiguration = global_application_configuration,
) -> Flask:
    """
    Creates and configures the Flask application instance.
    Follows factory pattern for clean isolation and testing.
    """
    flask_application: Flask = Flask(__name__)
    flask_application.config["SECRET_KEY"] = application_configuration.flask_secret_key

    # Calculate absolute base directory of the project
    base_project_directory: str = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    )
    web_application_distribution_directory: str = os.path.join(
        base_project_directory, "web_application", "dist"
    )
    mobile_application_distribution_directory: str = os.path.join(
        base_project_directory, "mobile_application", "dist"
    )

    # Register API Blueprints
    authentication_blueprint = create_authentication_blueprint()
    flask_application.register_blueprint(
        authentication_blueprint,
        url_prefix="/api/auth",
    )

    central_crm_blueprint = create_niravayak_central_crm_blueprint()
    flask_application.register_blueprint(
        central_crm_blueprint,
        url_prefix="/api/central",
    )

    society_admin_blueprint = create_society_admin_portal_blueprint()
    flask_application.register_blueprint(
        society_admin_blueprint,
        url_prefix="/api/admin",
    )

    # Global Health Check & API Metadata Endpoint
    @flask_application.route("/api/health", methods=["GET"])
    def handle_api_health_check():
        return (
            jsonify(
                {
                    "success": True,
                    "platform": "Smart Nivas",
                    "operator": "Niravayak Global",
                    "status": "OPERATIONAL",
                    "version": "1.0.0",
                }
            ),
            200,
        )

    # Static file serving and SPA fallback for Desktop Web Application
    # Routes: /central, /central/*, /admin, /admin/*
    @flask_application.route("/central", defaults={"subpath": ""})
    @flask_application.route("/central/", defaults={"subpath": ""})
    @flask_application.route("/central/<path:subpath>")
    @flask_application.route("/admin", defaults={"subpath": ""})
    @flask_application.route("/admin/", defaults={"subpath": ""})
    @flask_application.route("/admin/<path:subpath>")
    def serve_desktop_web_application(subpath: str):
        if os.path.exists(web_application_distribution_directory):
            requested_file_path: str = os.path.join(
                web_application_distribution_directory, subpath
            )
            if subpath and os.path.isfile(requested_file_path):
                return send_from_directory(
                    web_application_distribution_directory, subpath
                )
            return send_from_directory(
                web_application_distribution_directory, "index.html"
            )
        return (
            jsonify(
                {
                    "message": "Desktop Web Application bundle is being compiled or not yet built.",
                    "portal_target": request.path,
                }
            ),
            200,
        )

    # Static file serving and SPA fallback for Dedicated Mobile Application
    # Routes: /guard, /guard/*, /member, /member/*
    @flask_application.route("/guard", defaults={"subpath": ""})
    @flask_application.route("/guard/", defaults={"subpath": ""})
    @flask_application.route("/guard/<path:subpath>")
    @flask_application.route("/member", defaults={"subpath": ""})
    @flask_application.route("/member/", defaults={"subpath": ""})
    @flask_application.route("/member/<path:subpath>")
    def serve_dedicated_mobile_application(subpath: str):
        if os.path.exists(mobile_application_distribution_directory):
            requested_file_path: str = os.path.join(
                mobile_application_distribution_directory, subpath
            )
            if subpath and os.path.isfile(requested_file_path):
                return send_from_directory(
                    mobile_application_distribution_directory, subpath
                )
            return send_from_directory(
                mobile_application_distribution_directory, "index.html"
            )
        return (
            jsonify(
                {
                    "message": "Dedicated Mobile Application bundle is being compiled or not yet built.",
                    "mobile_target": request.path,
                }
            ),
            200,
        )

    # Static assets serving for Vite compiled bundles (/assets/*)
    @flask_application.route("/assets/<path:asset_filename>")
    def serve_compiled_static_assets(asset_filename: str):
        web_assets_directory: str = os.path.join(
            web_application_distribution_directory, "assets"
        )
        if os.path.exists(web_assets_directory):
            candidate_file_path: str = os.path.join(
                web_assets_directory, asset_filename
            )
            if os.path.isfile(candidate_file_path):
                return send_from_directory(web_assets_directory, asset_filename)

        mobile_assets_directory: str = os.path.join(
            mobile_application_distribution_directory, "assets"
        )
        if os.path.exists(mobile_assets_directory):
            candidate_file_path = os.path.join(
                mobile_assets_directory, asset_filename
            )
            if os.path.isfile(candidate_file_path):
                return send_from_directory(mobile_assets_directory, asset_filename)

        return jsonify({"error": f"Asset '{asset_filename}' not found."}), 404

    # PWA Manifests and Service Worker routes
    @flask_application.route("/manifest-security-guard.json")
    def serve_security_guard_manifest():
        pwa_public_directory: str = os.path.join(
            base_project_directory, "mobile_application", "public"
        )
        if os.path.exists(pwa_public_directory):
            return send_from_directory(
                pwa_public_directory, "manifest-security-guard.json"
            )
        return jsonify({"error": "manifest-security-guard.json not found"}), 404

    @flask_application.route("/manifest-resident-member.json")
    def serve_resident_member_manifest():
        pwa_public_directory: str = os.path.join(
            base_project_directory, "mobile_application", "public"
        )
        if os.path.exists(pwa_public_directory):
            return send_from_directory(
                pwa_public_directory, "manifest-resident-member.json"
            )
        return jsonify({"error": "manifest-resident-member.json not found"}), 404

    # Global 404 handler for API routes
    @flask_application.errorhandler(404)
    def handle_not_found_error(error_event):
        if request.path.startswith("/api/"):
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "RESOURCE_NOT_FOUND",
                        "message": f"The requested API endpoint '{request.path}' was not found.",
                    }
                ),
                404,
            )
        return (
            jsonify(
                {
                    "platform": "Smart Nivas",
                    "message": "Root entrypoint. Access /central, /admin, /guard, or /member.",
                }
            ),
            200,
        )

    # Global 500 handler
    @flask_application.errorhandler(500)
    def handle_internal_server_error(error_event):
        return (
            jsonify(
                {
                    "success": False,
                    "error_code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected internal server error occurred.",
                }
            ),
            500,
        )

    return flask_application
