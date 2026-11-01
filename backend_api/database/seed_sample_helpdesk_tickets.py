"""
Seed initial realistic sample complaints into helpdesk_tickets to support testing and rich visualization.
Includes water leaks in Wing B, electrical tripping in Wing A, lift jerk, and carpentry items.
"""

import sys
import os
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
)


def seed_sample_helpdesk_tickets():
    with global_database_connection_manager.database_transaction_scope() as cur:
        # Check if tickets already exist
        cur.execute("SELECT COUNT(*) AS c FROM helpdesk_tickets")
        cnt = cur.fetchone()["c"]
        if cnt > 0:
            print(f"Tickets already exist ({cnt} tickets found). Skipping initial seed.")
            return

        cur.execute("SELECT society_id FROM societies LIMIT 1")
        soc = cur.fetchone()
        if not soc:
            print("No society found.")
            return
        society_id = soc["society_id"]

        # Fetch categories
        cur.execute("SELECT category_id, category_name, sla_resolution_hours FROM helpdesk_categories WHERE society_id = %s", (society_id,))
        cats = {r["category_name"]: r for r in cur.fetchall()}

        now = datetime.now()

        # Sample tickets data
        samples = [
            # Frequent water leaks in Wing B
            {
                "wing": "Wing B", "flat": "B-302", "resident": "Jayeshbhai Patel", "phone": "9825100002",
                "cat": "Plumbing", "title": "Severe bathroom ceiling water seepage",
                "desc": "Continuous water drops leaking from flat B-402 bathroom directly onto our false ceiling. Moisture spreading rapidly.",
                "priority": "HIGH", "status": "OPEN", "assigned_type": "UNASSIGNED", "assigned_id": None, "assigned_name": None,
                "created_offset_h": -30, # Created 30 hours ago -> SLA is 24h -> OVERDUE!
                "photos": ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"]
            },
            {
                "wing": "Wing B", "flat": "B-104", "resident": "Suresh Shah", "phone": "9825100003",
                "cat": "Plumbing", "title": "Kitchen drainage pipe hairline crack & leaking",
                "desc": "Under-sink drainage PVC pipe has developed a split. Wastewater dripping under cabinet.",
                "priority": "MEDIUM", "status": "ASSIGNED", "assigned_type": "STAFF", "assigned_id": "STAFF-03", "assigned_name": "Kishan Solanki (Resident Plumber)",
                "created_offset_h": -10,
                "photos": []
            },
            {
                "wing": "Wing B", "flat": "B-501", "resident": "Kiranbhai Mehta", "phone": "9825100004",
                "cat": "Plumbing", "title": "Main shaft water leakage near meter box",
                "desc": "Heavy dripping in the common plumbing shaft outside flat 501. Water collecting near electrical meter board.",
                "priority": "CRITICAL", "status": "IN_PROGRESS", "assigned_type": "STAFF", "assigned_id": "STAFF-03", "assigned_name": "Kishan Solanki (Resident Plumber)",
                "created_offset_h": -5,
                "photos": ["https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80"]
            },
            {
                "wing": "Wing B", "flat": "B-203", "resident": "Dharmesh Soni", "phone": "9825100005",
                "cat": "Plumbing", "title": "Overhead tank supply valve stuck shut",
                "desc": "Low water pressure in flush cistern. Plumber visited and confirmed ball valve fixed.",
                "priority": "LOW", "status": "RESOLVED", "assigned_type": "STAFF", "assigned_id": "STAFF-03", "assigned_name": "Kishan Solanki (Resident Plumber)",
                "created_offset_h": -48, "resolved_offset_h": -28, "tat_min": 1200,
                "photos": []
            },
            # Electrical in Wing A
            {
                "wing": "Wing A", "flat": "A-102", "resident": "Amit Shah", "phone": "9825100001",
                "cat": "Electrical", "title": "Common corridor lighting fixture sparking",
                "desc": "Tube light fixture outside flat 102 flickers and gave off burning plastic smell.",
                "priority": "HIGH", "status": "OPEN", "assigned_type": "UNASSIGNED", "assigned_id": None, "assigned_name": None,
                "created_offset_h": -14, # SLA 12h -> OVERDUE!
                "photos": []
            },
            {
                "wing": "Wing A", "flat": "A-404", "resident": "Nitin Desai", "phone": "9825100006",
                "cat": "Elevator / Lift", "title": "Wing A passenger lift stopping with jerk on 4th floor",
                "desc": "Elevator makes sudden grinding sound and jerks violently before door opens on 4th floor.",
                "priority": "CRITICAL", "status": "IN_PROGRESS", "assigned_type": "STAFF", "assigned_id": "STAFF-02", "assigned_name": "Mohan Lal (Society Electrician)",
                "created_offset_h": -4,
                "photos": []
            },
            # Civil in Wing C
            {
                "wing": "Wing C", "flat": "C-201", "resident": "Pooja Trivedi", "phone": "9825100007",
                "cat": "Civil & Carpentry", "title": "Balcony safety railing bracket loosened",
                "desc": "Anchor bolts of balcony grill on 2nd floor came loose during monsoon winds.",
                "priority": "HIGH", "status": "ASSIGNED", "assigned_type": "STAFF", "assigned_id": "STAFF-01", "assigned_name": "Ramesh Patel (Facility Supervisor)",
                "created_offset_h": -20,
                "photos": []
            },
            # Housekeeping in Wing A
            {
                "wing": "Wing A", "flat": "A-G01", "resident": "Mehul Joshi", "phone": "9825100008",
                "cat": "Housekeeping", "title": "Garbage chute blocked on ground floor",
                "desc": "Cardboard boxes stuffed into chute causing bad odor in lobby.",
                "priority": "MEDIUM", "status": "RESOLVED", "assigned_type": "STAFF", "assigned_id": "STAFF-04", "assigned_name": "Bhikhabhai (Housekeeping Head)",
                "created_offset_h": -36, "resolved_offset_h": -31, "tat_min": 300,
                "photos": []
            }
        ]

        for s in samples:
            cat_obj = cats.get(s["cat"])
            if not cat_obj:
                continue
            cat_id = cat_obj["category_id"]
            sla_h = cat_obj["sla_resolution_hours"]

            t_id = str(uuid.uuid4())
            created_at = now + timedelta(hours=s["created_offset_h"])
            due_at = created_at + timedelta(hours=sla_h)
            resolved_at = (now + timedelta(hours=s["resolved_offset_h"])) if "resolved_offset_h" in s else None
            tat = s.get("tat_min")
            t_num = f"TKT-{created_at.strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
            import json

            cur.execute("""
                INSERT INTO helpdesk_tickets (
                    ticket_id, ticket_number, society_id, wing_name, flat_number,
                    resident_name, resident_phone, category_id, title, description,
                    attachments_json, priority, status, assigned_to_type,
                    assigned_to_id, assigned_to_name, due_at, resolved_at,
                    turnaround_minutes, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s
                )
            """, (
                t_id, t_num, society_id, s["wing"], s["flat"],
                s["resident"], s["phone"], cat_id, s["title"], s["desc"],
                json.dumps(s["photos"]), s["priority"], s["status"], s["assigned_type"],
                s["assigned_id"], s["assigned_name"], due_at, resolved_at,
                tat, created_at
            ))

            # Add internal note
            cur.execute("""
                INSERT INTO helpdesk_ticket_notes (
                    note_id, ticket_id, author_id, author_name, author_role, note_text, is_internal, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                str(uuid.uuid4()), t_id, "ADMIN-01", "Society Admin", "ADMIN",
                f"Complaint registered and logged under {s['cat']}. Priority set to {s['priority']}.",
                True, created_at + timedelta(minutes=5)
            ))

        print(f"Successfully seeded {len(samples)} realistic sample tickets with SLA, notes, and photos!")


if __name__ == "__main__":
    seed_sample_helpdesk_tickets()
