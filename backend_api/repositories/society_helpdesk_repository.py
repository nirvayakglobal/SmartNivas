"""
Society Helpdesk & Complaint Management Repository
Follows Clean Architecture and strict variable naming conventions.
Performs MySQL CRUD operations and aggregate reporting queries for Helpdesk tickets,
categories, SLA calculations, and internal notes.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import uuid

from backend_api.database.mysql_connection_pool_manager import (
    global_database_connection_manager,
    MySQLConnectionPoolManager,
)


class SocietyHelpdeskRepository:
    def __init__(
        self,
        database_connection_manager: MySQLConnectionPoolManager = global_database_connection_manager,
    ) -> None:
        self._database_connection_manager = database_connection_manager

    # -------------------------------------------------------------------------
    # Category Management
    # -------------------------------------------------------------------------

    def get_categories_by_society_id(self, society_id: int) -> List[Dict[str, Any]]:
        query = """
            SELECT 
                category_id,
                society_id,
                category_name,
                description,
                sla_resolution_hours,
                icon_name,
                badge_color,
                is_active,
                created_at,
                updated_at
            FROM helpdesk_categories
            WHERE society_id = %s
            ORDER BY category_name ASC
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, (society_id,))
            records = cursor.fetchall()
            return [dict(record) for record in records]

    def get_category_by_id(self, category_id: str) -> Optional[Dict[str, Any]]:
        query = """
            SELECT * FROM helpdesk_categories WHERE category_id = %s
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, (category_id,))
            record = cursor.fetchone()
            return dict(record) if record else None

    def create_category(
        self,
        category_id: str,
        society_id: int,
        category_name: str,
        description: str,
        sla_resolution_hours: int,
        icon_name: str = "Wrench",
        badge_color: str = "blue",
    ) -> Dict[str, Any]:
        query = """
            INSERT INTO helpdesk_categories (
                category_id, society_id, category_name, description,
                sla_resolution_hours, icon_name, badge_color, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(
                query,
                (
                    category_id,
                    society_id,
                    category_name,
                    description,
                    sla_resolution_hours,
                    icon_name,
                    badge_color,
                ),
            )
        return self.get_category_by_id(category_id)

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
        query = """
            UPDATE helpdesk_categories
            SET category_name = %s,
                description = %s,
                sla_resolution_hours = %s,
                icon_name = %s,
                badge_color = %s,
                is_active = %s
            WHERE category_id = %s
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(
                query,
                (
                    category_name,
                    description,
                    sla_resolution_hours,
                    icon_name,
                    badge_color,
                    is_active,
                    category_id,
                ),
            )
        return self.get_category_by_id(category_id)

    # -------------------------------------------------------------------------
    # Ticket Operations
    # -------------------------------------------------------------------------

    def create_ticket(
        self,
        ticket_id: str,
        ticket_number: str,
        society_id: int,
        wing_name: str,
        flat_number: str,
        resident_name: str,
        resident_phone: str,
        category_id: str,
        title: str,
        description: str,
        attachments_json: str,
        priority: str,
        due_at: datetime,
        flat_id: Optional[int] = None,
        resident_id: Optional[int] = None,
        assigned_to_type: str = "UNASSIGNED",
        assigned_to_id: Optional[str] = None,
        assigned_to_name: Optional[str] = None,
        status: str = "OPEN",
    ) -> Dict[str, Any]:
        query = """
            INSERT INTO helpdesk_tickets (
                ticket_id, ticket_number, society_id, flat_id, wing_name, flat_number,
                resident_id, resident_name, resident_phone, category_id,
                title, description, attachments_json, priority, status,
                assigned_to_type, assigned_to_id, assigned_to_name, due_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s
            )
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(
                query,
                (
                    ticket_id,
                    ticket_number,
                    society_id,
                    flat_id,
                    wing_name,
                    flat_number,
                    resident_id,
                    resident_name,
                    resident_phone,
                    category_id,
                    title,
                    description,
                    attachments_json,
                    priority,
                    status,
                    assigned_to_type,
                    assigned_to_id,
                    assigned_to_name,
                    due_at,
                ),
            )
        return self.get_ticket_by_id(ticket_id)

    def get_ticket_by_id(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        query = """
            SELECT 
                t.*,
                c.category_name,
                c.sla_resolution_hours,
                c.icon_name AS category_icon,
                c.badge_color AS category_color
            FROM helpdesk_tickets t
            JOIN helpdesk_categories c ON t.category_id = c.category_id
            WHERE t.ticket_id = %s
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, (ticket_id,))
            record = cursor.fetchone()
            if not record:
                return None
            res = dict(record)
            if isinstance(res.get("attachments_json"), str):
                try:
                    res["attachments"] = json.loads(res["attachments_json"])
                except Exception:
                    res["attachments"] = []
            elif isinstance(res.get("attachments_json"), list):
                res["attachments"] = res["attachments_json"]
            else:
                res["attachments"] = []
            return res

    def list_tickets_by_society_id(
        self,
        society_id: int,
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        wing_filter: Optional[str] = None,
        search_query: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query = """
            SELECT 
                t.*,
                c.category_name,
                c.sla_resolution_hours,
                c.icon_name AS category_icon,
                c.badge_color AS category_color
            FROM helpdesk_tickets t
            JOIN helpdesk_categories c ON t.category_id = c.category_id
            WHERE t.society_id = %s
        """
        params: List[Any] = [society_id]

        if status_filter and status_filter.upper() != "ALL":
            query += " AND t.status = %s"
            params.append(status_filter.upper())

        if category_filter and category_filter != "ALL":
            query += " AND t.category_id = %s"
            params.append(category_filter)

        if wing_filter and wing_filter != "ALL":
            query += " AND t.wing_name = %s"
            params.append(wing_filter)

        if search_query:
            query += " AND (t.ticket_number LIKE %s OR t.title LIKE %s OR t.flat_number LIKE %s OR t.resident_name LIKE %s)"
            search_pattern = f"%{search_query}%"
            params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

        query += " ORDER BY t.created_at DESC"

        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, tuple(params))
            records = cursor.fetchall()
            results = []
            for record in records:
                row = dict(record)
                if isinstance(row.get("attachments_json"), str):
                    try:
                        row["attachments"] = json.loads(row["attachments_json"])
                    except Exception:
                        row["attachments"] = []
                elif isinstance(row.get("attachments_json"), list):
                    row["attachments"] = row["attachments_json"]
                else:
                    row["attachments"] = []
                results.append(row)
            return results

    def update_ticket_status(
        self, ticket_id: str, new_status: str, turnaround_minutes: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        resolved_at = datetime.now() if new_status in ("RESOLVED", "CLOSED") else None
        
        query = """
            UPDATE helpdesk_tickets
            SET status = %s,
                resolved_at = %s,
                turnaround_minutes = COALESCE(%s, turnaround_minutes)
            WHERE ticket_id = %s
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, (new_status, resolved_at, turnaround_minutes, ticket_id))
        return self.get_ticket_by_id(ticket_id)

    def assign_ticket(
        self,
        ticket_id: str,
        assigned_to_type: str,
        assigned_to_id: str,
        assigned_to_name: str,
    ) -> Optional[Dict[str, Any]]:
        query = """
            UPDATE helpdesk_tickets
            SET assigned_to_type = %s,
                assigned_to_id = %s,
                assigned_to_name = %s,
                status = CASE WHEN status = 'OPEN' THEN 'ASSIGNED' ELSE status END
            WHERE ticket_id = %s
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(
                query, (assigned_to_type, assigned_to_id, assigned_to_name, ticket_id)
            )
        return self.get_ticket_by_id(ticket_id)

    # -------------------------------------------------------------------------
    # Internal Notes & Chat Thread
    # -------------------------------------------------------------------------

    def add_ticket_note(
        self,
        note_id: str,
        ticket_id: str,
        author_id: str,
        author_name: str,
        author_role: str,
        note_text: str,
        is_internal: bool = True,
    ) -> Dict[str, Any]:
        query = """
            INSERT INTO helpdesk_ticket_notes (
                note_id, ticket_id, author_id, author_name, author_role, note_text, is_internal
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(
                query,
                (
                    note_id,
                    ticket_id,
                    author_id,
                    author_name,
                    author_role,
                    note_text,
                    is_internal,
                ),
            )
        return {
            "note_id": note_id,
            "ticket_id": ticket_id,
            "author_id": author_id,
            "author_name": author_name,
            "author_role": author_role,
            "note_text": note_text,
            "is_internal": is_internal,
            "created_at": datetime.now().isoformat(),
        }

    def get_ticket_notes(self, ticket_id: str) -> List[Dict[str, Any]]:
        query = """
            SELECT 
                note_id, ticket_id, author_id, author_name, author_role, note_text, is_internal, created_at
            FROM helpdesk_ticket_notes
            WHERE ticket_id = %s
            ORDER BY created_at ASC
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, (ticket_id,))
            records = cursor.fetchall()
            return [dict(r) for r in records]

    # -------------------------------------------------------------------------
    # Reports & Analytics
    # -------------------------------------------------------------------------

    def get_turnaround_time_analytics(self, society_id: int) -> List[Dict[str, Any]]:
        query = """
            SELECT 
                c.category_id,
                c.category_name,
                c.sla_resolution_hours,
                c.icon_name,
                c.badge_color,
                COUNT(t.ticket_id) AS total_resolved_tickets,
                COALESCE(ROUND(AVG(t.turnaround_minutes) / 60.0, 1), 0.0) AS avg_turnaround_hours,
                SUM(CASE WHEN t.turnaround_minutes > (c.sla_resolution_hours * 60) THEN 1 ELSE 0 END) AS breached_sla_count
            FROM helpdesk_categories c
            LEFT JOIN helpdesk_tickets t ON c.category_id = t.category_id 
                AND t.society_id = %s 
                AND t.status IN ('RESOLVED', 'CLOSED')
                AND t.turnaround_minutes IS NOT NULL
            WHERE c.society_id = %s
            GROUP BY c.category_id, c.category_name, c.sla_resolution_hours, c.icon_name, c.badge_color
            ORDER BY total_resolved_tickets DESC, c.category_name ASC
        """
        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(query, (society_id, society_id))
            records = cursor.fetchall()
            return [dict(r) for r in records]

    def get_volume_and_trend_report(self, society_id: int) -> Dict[str, Any]:
        """
        Provides breakdown by Wing (to highlight recurring issues like frequent water leaks in Wing B),
        and overall category breakdown.
        """
        wing_query = """
            SELECT 
                t.wing_name,
                c.category_name,
                COUNT(t.ticket_id) AS ticket_count
            FROM helpdesk_tickets t
            JOIN helpdesk_categories c ON t.category_id = c.category_id
            WHERE t.society_id = %s
            GROUP BY t.wing_name, c.category_name
            ORDER BY t.wing_name ASC, ticket_count DESC
        """

        status_counts_query = """
            SELECT 
                status,
                COUNT(ticket_id) AS status_count
            FROM helpdesk_tickets
            WHERE society_id = %s
            GROUP BY status
        """

        overdue_query = """
            SELECT COUNT(ticket_id) AS overdue_count
            FROM helpdesk_tickets
            WHERE society_id = %s
              AND status NOT IN ('RESOLVED', 'CLOSED')
              AND due_at < NOW()
        """

        with self._database_connection_manager.database_transaction_scope() as cursor:
            cursor.execute(wing_query, (society_id,))
            wing_data = [dict(r) for r in cursor.fetchall()]

            cursor.execute(status_counts_query, (society_id,))
            status_data = {r["status"]: r["status_count"] for r in cursor.fetchall()}

            cursor.execute(overdue_query, (society_id,))
            overdue_record = cursor.fetchone()
            overdue_count = overdue_record["overdue_count"] if overdue_record else 0

        return {
            "wing_breakdown": wing_data,
            "status_summary": status_data,
            "overdue_tickets_count": overdue_count,
        }
