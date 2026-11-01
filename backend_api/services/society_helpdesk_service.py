"""
Society Helpdesk & Complaint Management Service
Implements business rules: SLA due date calculation, overdue badge computation,
TAT tracking, ticket lifecycle transitions, internal notes, and vendor/staff mapping.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
import uuid

from backend_api.repositories.society_helpdesk_repository import (
    SocietyHelpdeskRepository,
)
from backend_api.services.society_accounts_payable_service import (
    SocietyAccountsPayableService,
)


class SocietyHelpdeskService:
    def __init__(
        self,
        helpdesk_repository: Optional[SocietyHelpdeskRepository] = None,
    ) -> None:
        self._helpdesk_repository = helpdesk_repository or SocietyHelpdeskRepository()

    # -------------------------------------------------------------------------
    # Category Services
    # -------------------------------------------------------------------------

    def get_categories(self, society_id: int) -> List[Dict[str, Any]]:
        return self._helpdesk_repository.get_categories_by_society_id(society_id)

    def create_category(
        self,
        society_id: int,
        category_name: str,
        description: str,
        sla_resolution_hours: int,
        icon_name: str = "Wrench",
        badge_color: str = "blue",
    ) -> Dict[str, Any]:
        category_id = str(uuid.uuid4())
        return self._helpdesk_repository.create_category(
            category_id=category_id,
            society_id=society_id,
            category_name=category_name.strip(),
            description=description.strip(),
            sla_resolution_hours=int(sla_resolution_hours),
            icon_name=icon_name,
            badge_color=badge_color,
        )

    def update_category(
        self,
        category_id: str,
        category_name: str,
        description: str,
        sla_resolution_hours: int,
        icon_name: str,
        badge_color: str,
        is_active: bool,
    ) -> Optional[Dict[str, Any]]:
        return self._helpdesk_repository.update_category(
            category_id=category_id,
            category_name=category_name.strip(),
            description=description.strip(),
            sla_resolution_hours=int(sla_resolution_hours),
            icon_name=icon_name,
            badge_color=badge_color,
            is_active=is_active,
        )

    # -------------------------------------------------------------------------
    # Ticket Services
    # -------------------------------------------------------------------------

    def create_ticket(
        self,
        society_id: int,
        category_id: str,
        wing_name: str,
        flat_number: str,
        resident_name: str,
        resident_phone: str,
        title: str,
        description: str,
        priority: str = "MEDIUM",
        attachments: Optional[List[str]] = None,
        flat_id: Optional[int] = None,
        resident_id: Optional[int] = None,
        assigned_to_type: str = "UNASSIGNED",
        assigned_to_id: Optional[str] = None,
        assigned_to_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        # 1. Fetch category to calculate SLA due date
        category = self._helpdesk_repository.get_category_by_id(category_id)
        if not category:
            raise ValueError(f"Helpdesk category with ID '{category_id}' not found.")

        sla_hours = int(category.get("sla_resolution_hours", 24))
        now = datetime.now()
        due_at = now + timedelta(hours=sla_hours)

        ticket_id = str(uuid.uuid4())
        # Generate ticket number e.g. TKT-202611-0492
        random_suffix = uuid.uuid4().hex[:4].upper()
        ticket_number = f"TKT-{now.strftime('%Y%m')}-{random_suffix}"

        attachments_json = json.dumps(attachments or [])
        status = "ASSIGNED" if assigned_to_name else "OPEN"

        ticket = self._helpdesk_repository.create_ticket(
            ticket_id=ticket_id,
            ticket_number=ticket_number,
            society_id=society_id,
            wing_name=wing_name.strip(),
            flat_number=flat_number.strip(),
            resident_name=resident_name.strip(),
            resident_phone=resident_phone.strip() if resident_phone else None,
            category_id=category_id,
            title=title.strip(),
            description=description.strip(),
            attachments_json=attachments_json,
            priority=priority.upper(),
            due_at=due_at,
            flat_id=flat_id,
            resident_id=resident_id,
            assigned_to_type=assigned_to_type,
            assigned_to_id=assigned_to_id,
            assigned_to_name=assigned_to_name,
            status=status,
        )
        return self._enrich_ticket_metadata(ticket)

    def list_tickets(
        self,
        society_id: int,
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        wing_filter: Optional[str] = None,
        search_query: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        raw_tickets = self._helpdesk_repository.list_tickets_by_society_id(
            society_id=society_id,
            status_filter=status_filter,
            category_filter=category_filter,
            wing_filter=wing_filter,
            search_query=search_query,
        )
        return [self._enrich_ticket_metadata(t) for t in raw_tickets]

    def get_ticket_details(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        ticket = self._helpdesk_repository.get_ticket_by_id(ticket_id)
        if not ticket:
            return None
        enriched = self._enrich_ticket_metadata(ticket)
        enriched["notes"] = self._helpdesk_repository.get_ticket_notes(ticket_id)
        return enriched

    def update_ticket_status(self, ticket_id: str, new_status: str) -> Optional[Dict[str, Any]]:
        ticket = self._helpdesk_repository.get_ticket_by_id(ticket_id)
        if not ticket:
            return None

        clean_status = new_status.upper().strip()
        turnaround_minutes = None

        if clean_status in ("RESOLVED", "CLOSED"):
            created_at = ticket.get("created_at")
            if isinstance(created_at, datetime):
                delta = datetime.now() - created_at
                turnaround_minutes = max(1, int(delta.total_seconds() / 60))

        updated_ticket = self._helpdesk_repository.update_ticket_status(
            ticket_id=ticket_id,
            new_status=clean_status,
            turnaround_minutes=turnaround_minutes,
        )
        return self._enrich_ticket_metadata(updated_ticket)

    def assign_ticket(
        self,
        ticket_id: str,
        assigned_to_type: str,
        assigned_to_id: str,
        assigned_to_name: str,
    ) -> Optional[Dict[str, Any]]:
        updated = self._helpdesk_repository.assign_ticket(
            ticket_id=ticket_id,
            assigned_to_type=assigned_to_type,
            assigned_to_id=assigned_to_id,
            assigned_to_name=assigned_to_name,
        )
        return self._enrich_ticket_metadata(updated)

    def add_internal_note(
        self,
        ticket_id: str,
        author_id: str,
        author_name: str,
        author_role: str,
        note_text: str,
        is_internal: bool = True,
    ) -> Dict[str, Any]:
        note_id = str(uuid.uuid4())
        return self._helpdesk_repository.add_ticket_note(
            note_id=note_id,
            ticket_id=ticket_id,
            author_id=author_id,
            author_name=author_name,
            author_role=author_role,
            note_text=note_text.strip(),
            is_internal=is_internal,
        )

    # -------------------------------------------------------------------------
    # Assignees Directory Helper (Staff + Registered Vendors)
    # -------------------------------------------------------------------------

    def get_assignees(self, society_id: int) -> Dict[str, Any]:
        """
        Returns registered external vendors from society_vendors and
        internal society staff for quick assign selection.
        """
        vendors_list = []
        try:
            raw_vendors = SocietyAccountsPayableService.get_vendors(society_id, only_active=True)
            for v in raw_vendors:
                vendors_list.append({
                    "id": str(v["vendor_id"]),
                    "name": v["vendor_name"],
                    "category": v.get("trade_category", "Vendor"),
                    "phone": v.get("phone_number", ""),
                    "type": "VENDOR"
                })
        except Exception:
            vendors_list = []

        # Standard society internal staff roster
        staff_list = [
            {"id": "STAFF-01", "name": "Ramesh Patel (Facility Supervisor)", "category": "Facility Management", "type": "STAFF"},
            {"id": "STAFF-02", "name": "Mohan Lal (Society Electrician)", "category": "Electrical", "type": "STAFF"},
            {"id": "STAFF-03", "name": "Kishan Solanki (Resident Plumber)", "category": "Plumbing", "type": "STAFF"},
            {"id": "STAFF-04", "name": "Bhikhabhai (Housekeeping Head)", "category": "Housekeeping", "type": "STAFF"},
            {"id": "STAFF-05", "name": "Security Main Gate (Gate Guard)", "category": "Security", "type": "STAFF"},
        ]

        return {
            "staff": staff_list,
            "vendors": vendors_list,
        }

    # -------------------------------------------------------------------------
    # Analytics & Reports
    # -------------------------------------------------------------------------

    def get_tat_analytics(self, society_id: int) -> List[Dict[str, Any]]:
        return self._helpdesk_repository.get_turnaround_time_analytics(society_id)

    def get_volume_trend_analytics(self, society_id: int) -> Dict[str, Any]:
        return self._helpdesk_repository.get_volume_and_trend_report(society_id)

    # -------------------------------------------------------------------------
    # Private Helpers
    # -------------------------------------------------------------------------

    def _enrich_ticket_metadata(self, ticket: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not ticket:
            return None

        result = dict(ticket)
        due_at = result.get("due_at")
        status = result.get("status", "OPEN")
        now = datetime.now()

        # Check overdue status
        is_overdue = False
        remaining_or_overdue_hours = 0.0

        if isinstance(due_at, datetime):
            if status not in ("RESOLVED", "CLOSED") and now > due_at:
                is_overdue = True
                delta = now - due_at
                remaining_or_overdue_hours = round(delta.total_seconds() / 3600.0, 1)
            elif status not in ("RESOLVED", "CLOSED"):
                delta = due_at - now
                remaining_or_overdue_hours = round(delta.total_seconds() / 3600.0, 1)

        result["is_overdue"] = is_overdue
        result["hours_delta"] = remaining_or_overdue_hours

        # Format dates as ISO strings
        for field in ("created_at", "updated_at", "due_at", "resolved_at"):
            if isinstance(result.get(field), datetime):
                result[field] = result[field].isoformat()

        return result
