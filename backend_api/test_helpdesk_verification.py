"""
Verification script for Helpdesk & Complaint Management Module
Tests API endpoints, ticket creation, status transitions, SLA calculations,
quick assignments, internal chat notes, and analytical reports.
"""

import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend_api.application_factory import create_smart_nivas_flask_application
from backend_api.middlewares.jwt_authentication_middleware import (
    generate_jwt_access_token,
    AuthenticatedUserContext,
)


def run_helpdesk_verification():
    flask_app = create_smart_nivas_flask_application()
    client = flask_app.test_client()

    print("=====================================================================")
    print("  VERIFYING HELPDESK & COMPLAINT MANAGEMENT MODULE (BACKEND API)")
    print("=====================================================================")

    # Generate test JWT for Society Admin (Society ID 1)
    auth_token = generate_jwt_access_token(
        user_id=1,
        society_id=1,
        flat_id=None,
        user_role="SOCIETY_ADMIN",
        phone_number="9825100000",
        full_name="Society Admin",
    )
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json",
    }

    # 1. Fetch Categories & SLA
    print("\n[Step 1] Fetching Complaint Categories & SLA Configurations...")
    res = client.get("/api/admin/helpdesk/categories", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.data}"
    categories_data = res.get_json()
    assert categories_data["success"] is True
    categories = categories_data["categories"]
    print(f" -> Found {len(categories)} categories (e.g., {[c['category_name'] for c in categories[:3]]})")
    plumbing_cat = next(c for c in categories if c["category_name"] == "Plumbing")
    print(f" -> Plumbing SLA Resolution Time: {plumbing_cat['sla_resolution_hours']} hours")

    # 2. Fetch Tickets (Kanban Board query)
    print("\n[Step 2] Fetching Kanban Tickets...")
    res = client.get("/api/admin/helpdesk/tickets", headers=headers)
    assert res.status_code == 200
    tickets_data = res.get_json()
    assert tickets_data["success"] is True
    tickets = tickets_data["tickets"]
    print(f" -> Loaded {len(tickets)} total tickets across all statuses")

    overdue_tickets = [t for t in tickets if t.get("is_overdue")]
    print(f" -> Overdue tickets identified by SLA timers: {len(overdue_tickets)}")
    for ot in overdue_tickets:
        print(f"    * {ot['ticket_number']} ({ot['title']}) - Overdue by {ot['hours_delta']} hrs!")

    # 3. Create a New Complaint Ticket
    print("\n[Step 3] Logging a new complaint ticket...")
    new_ticket_payload = {
        "category_id": plumbing_cat["category_id"],
        "wing_name": "Wing B",
        "flat_number": "B-402",
        "resident_name": "Nirav Patel",
        "resident_phone": "9825100001",
        "title": "Kitchen faucet leaking constantly",
        "description": "High pressure tap in kitchen mixer won't shut off completely.",
        "priority": "MEDIUM",
        "attachments": [
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"
        ],
    }
    res = client.post(
        "/api/admin/helpdesk/tickets",
        headers=headers,
        data=json.dumps(new_ticket_payload),
    )
    assert res.status_code == 201, f"Failed ticket creation: {res.data}"
    created_ticket = res.get_json()["ticket"]
    ticket_id = created_ticket["ticket_id"]
    print(f" -> Created ticket: {created_ticket['ticket_number']} | Status: {created_ticket['status']} | Due at: {created_ticket['due_at']}")

    # 4. Fetch Assignees (Staff + Vendors)
    print("\n[Step 4] Fetching Quick-Assign Directory (Staff & Vendors)...")
    res = client.get("/api/admin/helpdesk/assignees", headers=headers)
    assert res.status_code == 200
    assignees_data = res.get_json()["assignees"]
    print(f" -> Available Staff: {len(assignees_data['staff'])} | Vendors: {len(assignees_data['vendors'])}")

    # 5. Quick Assign Ticket to Plumber Staff
    print("\n[Step 5] Quick Assigning ticket to Kishan Solanki (Resident Plumber)...")
    assign_payload = {
        "assigned_to_type": "STAFF",
        "assigned_to_id": "STAFF-03",
        "assigned_to_name": "Kishan Solanki (Resident Plumber)",
    }
    res = client.put(
        f"/api/admin/helpdesk/tickets/{ticket_id}/assign",
        headers=headers,
        data=json.dumps(assign_payload),
    )
    assert res.status_code == 200
    assigned_ticket = res.get_json()["ticket"]
    assert assigned_ticket["status"] == "ASSIGNED"
    print(f" -> Successfully assigned! Current status: {assigned_ticket['status']} | Assigned to: {assigned_ticket['assigned_to_name']}")

    # 6. Add Internal Note
    print("\n[Step 6] Posting internal technician note...")
    note_payload = {
        "author_name": "Kishan Solanki",
        "author_role": "TECHNICIAN",
        "note_text": "Inspected kitchen mixer valve. Rubber washer needs replacement. Sourcing parts.",
        "is_internal": True,
    }
    res = client.post(
        f"/api/admin/helpdesk/tickets/{ticket_id}/notes",
        headers=headers,
        data=json.dumps(note_payload),
    )
    assert res.status_code == 201
    print(f" -> Note saved: '{note_payload['note_text']}'")

    # 7. Update Status (Move on Kanban: IN_PROGRESS -> RESOLVED)
    print("\n[Step 7] Updating ticket status to IN_PROGRESS and then RESOLVED...")
    res = client.put(
        f"/api/admin/helpdesk/tickets/{ticket_id}/status",
        headers=headers,
        data=json.dumps({"status": "IN_PROGRESS"}),
    )
    assert res.status_code == 200
    assert res.get_json()["ticket"]["status"] == "IN_PROGRESS"

    res = client.put(
        f"/api/admin/helpdesk/tickets/{ticket_id}/status",
        headers=headers,
        data=json.dumps({"status": "RESOLVED"}),
    )
    assert res.status_code == 200
    resolved_ticket = res.get_json()["ticket"]
    assert resolved_ticket["status"] == "RESOLVED"
    print(f" -> Ticket resolved! Resolved at: {resolved_ticket['resolved_at']} | Turnaround: {resolved_ticket['turnaround_minutes']} min")

    # 8. TAT Analytics & Volume/Trend Reports
    print("\n[Step 8] Verifying Turnaround Time (TAT) Analytics...")
    res = client.get("/api/admin/helpdesk/reports/tat", headers=headers)
    assert res.status_code == 200
    tat_report = res.get_json()["tat_analytics"]
    print(f" -> TAT Categories analyzed: {len(tat_report)}")
    for row in tat_report:
        if row["total_resolved_tickets"] > 0:
            print(f"    * {row['category_name']}: {row['total_resolved_tickets']} resolved | Avg TAT: {row['avg_turnaround_hours']}h (SLA: {row['sla_resolution_hours']}h)")

    print("\n[Step 9] Verifying Volume & Trend Report...")
    res = client.get("/api/admin/helpdesk/reports/trends", headers=headers)
    assert res.status_code == 200
    trend_data = res.get_json()["trend_analytics"]
    print(f" -> Status Summary: {trend_data['status_summary']}")
    print(f" -> Wing Breakdown highlights:")
    for wb in trend_data["wing_breakdown"][:5]:
        print(f"    * {wb['wing_name']} - {wb['category_name']}: {wb['ticket_count']} complaints")

    print("\n=====================================================================")
    print("  ALL BACKEND HELPDESK & SLA CONTROLLER TESTS PASSED SUCCESSFULLY!  ")
    print("=====================================================================")


if __name__ == "__main__":
    run_helpdesk_verification()
