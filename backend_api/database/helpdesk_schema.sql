-- ============================================================================
-- Smart Nivas - Helpdesk & Complaint Management Schema
-- Owned and Operated by Niravayak Global
-- Compatible with MySQL 8.0+ / MariaDB InnoDB engine
-- ============================================================================

CREATE TABLE IF NOT EXISTS helpdesk_categories (
    category_id VARCHAR(36) PRIMARY KEY,
    society_id INT(11) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    sla_resolution_hours INT NOT NULL DEFAULT 24,
    icon_name VARCHAR(50) DEFAULT 'Wrench',
    badge_color VARCHAR(50) DEFAULT 'blue',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_helpdesk_categories_society (society_id),
    CONSTRAINT fk_helpdesk_categories_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS helpdesk_tickets (
    ticket_id VARCHAR(36) PRIMARY KEY,
    ticket_number VARCHAR(32) NOT NULL UNIQUE,
    society_id INT(11) NOT NULL,
    flat_id INT(11) NULL,
    wing_name VARCHAR(20) NOT NULL,
    flat_number VARCHAR(20) NOT NULL,
    resident_id INT(11) NULL,
    resident_name VARCHAR(150) NOT NULL,
    resident_phone VARCHAR(20) NULL,
    category_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    attachments_json JSON NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    status ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    assigned_to_type ENUM('STAFF', 'VENDOR', 'UNASSIGNED') NOT NULL DEFAULT 'UNASSIGNED',
    assigned_to_id VARCHAR(36) NULL,
    assigned_to_name VARCHAR(150) NULL,
    due_at DATETIME NOT NULL,
    resolved_at DATETIME NULL,
    turnaround_minutes INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_helpdesk_tickets_society_status (society_id, status),
    INDEX idx_helpdesk_tickets_category (category_id),
    INDEX idx_helpdesk_tickets_wing (society_id, wing_name),
    INDEX idx_helpdesk_tickets_due (due_at),
    CONSTRAINT fk_helpdesk_tickets_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    CONSTRAINT fk_helpdesk_tickets_category FOREIGN KEY (category_id) REFERENCES helpdesk_categories(category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS helpdesk_ticket_notes (
    note_id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) NOT NULL,
    author_id VARCHAR(50) NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    author_role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    note_text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_helpdesk_notes_ticket (ticket_id, created_at),
    CONSTRAINT fk_helpdesk_notes_ticket FOREIGN KEY (ticket_id) REFERENCES helpdesk_tickets(ticket_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
