-- Daily Staff & Helper Management Schema for SmartNivas

CREATE TABLE IF NOT EXISTS society_daily_staff (
    staff_id VARCHAR(36) PRIMARY KEY,
    society_id VARCHAR(36) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    role_category VARCHAR(50) NOT NULL DEFAULT 'Maid',
    gender VARCHAR(10) DEFAULT 'Female',
    photo_url TEXT NULL,
    id_proof_type VARCHAR(50) DEFAULT 'Aadhaar',
    id_proof_number VARCHAR(100) NULL,
    id_proof_document_url TEXT NULL,
    is_id_proof_verified BOOLEAN DEFAULT FALSE,
    police_verification_status ENUM('Pending', 'Verified', 'Rejected', 'Exempt') DEFAULT 'Pending',
    police_verification_doc_url TEXT NULL,
    police_verification_date DATE NULL,
    status ENUM('Active', 'Inactive', 'Blacklisted', 'Pending_KYC') DEFAULT 'Pending_KYC',
    emergency_contact_name VARCHAR(150) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff_soc_status (society_id, status),
    INDEX idx_staff_soc_phone (society_id, phone_number),
    INDEX idx_staff_soc_category (society_id, role_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS society_staff_flat_assignments (
    assignment_id VARCHAR(36) PRIMARY KEY,
    society_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    flat_id VARCHAR(36) NULL,
    flat_number VARCHAR(50) NOT NULL,
    resident_name VARCHAR(150) NULL,
    resident_phone VARCHAR(20) NULL,
    start_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_assign_staff (staff_id),
    INDEX idx_assign_society_flat (society_id, flat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS society_staff_attendance_logs (
    log_id VARCHAR(36) PRIMARY KEY,
    society_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    staff_name VARCHAR(150) NOT NULL,
    role_category VARCHAR(50) NOT NULL,
    entry_gate VARCHAR(50) DEFAULT 'Main Gate',
    exit_gate VARCHAR(50) NULL,
    entry_timestamp DATETIME NOT NULL,
    exit_timestamp DATETIME NULL,
    checked_in_by_guard_id VARCHAR(36) NULL,
    checked_out_by_guard_id VARCHAR(36) NULL,
    flats_visited TEXT NULL,
    remarks VARCHAR(255) NULL,
    is_overstay BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_att_soc_entry (society_id, entry_timestamp),
    INDEX idx_att_staff_entry (staff_id, entry_timestamp),
    INDEX idx_att_active_status (society_id, exit_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS society_staff_blacklist_audit (
    audit_id VARCHAR(36) PRIMARY KEY,
    society_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    staff_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    role_category VARCHAR(50) NOT NULL,
    action_type ENUM('Blacklist', 'Unblacklist') NOT NULL,
    reason TEXT NOT NULL,
    reported_by_admin_id VARCHAR(36) NOT NULL,
    reported_by_admin_name VARCHAR(150) NOT NULL,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_black_soc_time (society_id, action_timestamp),
    INDEX idx_black_staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS society_staff_config (
    config_id VARCHAR(36) PRIMARY KEY,
    society_id VARCHAR(36) UNIQUE NOT NULL,
    enforce_mandatory_id_proof BOOLEAN DEFAULT TRUE,
    enforce_mandatory_police_verification BOOLEAN DEFAULT FALSE,
    daily_entry_start_time TIME DEFAULT '06:00:00',
    daily_entry_cutoff_time TIME DEFAULT '22:00:00',
    allow_emergency_night_entry BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
