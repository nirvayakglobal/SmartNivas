-- =================================================================================
-- SMART NIVAS PHASE 1 MYSQL INNODB SCHEMA
-- Owned and Operated by Niravayak Global
-- Every table enforces ENGINE=InnoDB and CHARSET=utf8mb4 for ACID Compliance
-- =================================================================================

-- Drop existing tables in reverse dependency order for clean recreation if required
DROP TABLE IF EXISTS notices;
DROP TABLE IF EXISTS pre_approvals;
DROP TABLE IF EXISTS visit_logs;
DROP TABLE IF EXISTS society_visitors;
DROP TABLE IF EXISTS push_subscriptions;
DROP TABLE IF EXISTS gates;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS flats;
DROP TABLE IF EXISTS wings;
DROP TABLE IF EXISTS b2b_invoices;
DROP TABLE IF EXISTS societies;
DROP TABLE IF EXISTS crm_leads;
DROP TABLE IF EXISTS subscription_plans;

-- =================================================================================
-- PART A: NIRAVAYAK GLOBAL COMMERCIAL CRM & LICENSING TABLES (SUPER_ADMIN ONLY)
-- =================================================================================

CREATE TABLE subscription_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(80) NOT NULL,
    billing_cycle ENUM('MONTHLY', 'QUARTERLY', 'YEARLY') DEFAULT 'YEARLY',
    base_price_inr DECIMAL(10,2) NOT NULL,
    max_gates_allowed INT NOT NULL DEFAULT 2,
    photo_retention_days INT NOT NULL DEFAULT 45,
    enable_walkin_approval BOOLEAN NOT NULL DEFAULT TRUE,
    enable_preapproval_passcode BOOLEAN NOT NULL DEFAULT TRUE,
    enable_visitor_photo BOOLEAN NOT NULL DEFAULT TRUE,
    enable_leave_at_gate BOOLEAN NOT NULL DEFAULT FALSE,
    enable_notice_board BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE crm_leads (
    lead_id INT AUTO_INCREMENT PRIMARY KEY,
    prospective_society_name VARCHAR(150) NOT NULL,
    city_name VARCHAR(80) NOT NULL,
    contact_person_name VARCHAR(120) NOT NULL,
    contact_phone_number VARCHAR(20) NOT NULL,
    contact_email_address VARCHAR(120) NULL,
    pipeline_stage ENUM('NEW_LEAD', 'DEMO_SCHEDULED', 'PROPOSAL_SENT', 'WON', 'LOST') DEFAULT 'NEW_LEAD',
    follow_up_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE societies (
    society_id INT AUTO_INCREMENT PRIMARY KEY,
    society_legal_name VARCHAR(150) NOT NULL,
    society_unique_code VARCHAR(20) UNIQUE NOT NULL,
    registration_number VARCHAR(80) NULL,
    billing_address TEXT NULL,
    city_name VARCHAR(80) NOT NULL,
    state_name VARCHAR(80) DEFAULT 'Gujarat',
    gstin_number VARCHAR(20) NULL,
    rwa_contact_person_name VARCHAR(120) NOT NULL,
    rwa_contact_phone_number VARCHAR(20) NOT NULL,
    rwa_contact_email_address VARCHAR(120) NULL,
    subscribed_plan_id INT NOT NULL,
    max_gates_allowed INT NOT NULL DEFAULT 2,
    photo_retention_days INT NOT NULL DEFAULT 45,
    enable_walkin_approval BOOLEAN NOT NULL DEFAULT TRUE,
    enable_preapproval_passcode BOOLEAN NOT NULL DEFAULT TRUE,
    enable_visitor_photo BOOLEAN NOT NULL DEFAULT TRUE,
    enable_leave_at_gate BOOLEAN NOT NULL DEFAULT FALSE,
    enable_notice_board BOOLEAN NOT NULL DEFAULT FALSE,
    license_status ENUM('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'SUSPENDED') DEFAULT 'TRIAL',
    subscription_start_date DATE NOT NULL,
    subscription_expiry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_society_plan FOREIGN KEY (subscribed_plan_id) REFERENCES subscription_plans(plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE b2b_invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    invoice_number VARCHAR(40) UNIQUE NOT NULL,
    base_amount_inr DECIMAL(10,2) NOT NULL,
    gst_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount_inr DECIMAL(10,2) NOT NULL,
    payment_status ENUM('UNPAID', 'PAID', 'CANCELLED') DEFAULT 'UNPAID',
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =================================================================================
-- PART B: PRIVATE SOCIETY OPERATIONAL TABLES (ZERO ACCESS FOR NIRAVAYAK SUPER_ADMIN)
-- =================================================================================

CREATE TABLE wings (
    wing_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    wing_name VARCHAR(50) NOT NULL,
    CONSTRAINT fk_wing_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    UNIQUE KEY uq_society_wing_name (society_id, wing_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE flats (
    flat_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    wing_id INT NOT NULL,
    flat_number VARCHAR(20) NOT NULL,
    floor_number INT NULL,
    occupancy_status ENUM('VACANT', 'OWNER_OCCUPIED', 'TENANT_OCCUPIED') DEFAULT 'OWNER_OCCUPIED',
    CONSTRAINT fk_flat_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    CONSTRAINT fk_flat_wing FOREIGN KEY (wing_id) REFERENCES wings(wing_id) ON DELETE CASCADE,
    UNIQUE KEY uq_wing_flat_number (wing_id, flat_number),
    INDEX idx_society_flats (society_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NULL,
    flat_id INT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_role ENUM('SUPER_ADMIN', 'SOCIETY_ADMIN', 'GUARD', 'RESIDENT') NOT NULL,
    resident_type ENUM('OWNER', 'TENANT', 'FAMILY_MEMBER') NULL,
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED',
    bootstrap_activation_token VARCHAR(120) NULL,
    is_bootstrap_pending BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_society_phone_role (society_id, phone_number, user_role),
    CONSTRAINT fk_user_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_flat FOREIGN KEY (flat_id) REFERENCES flats(flat_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE gates (
    gate_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    gate_name VARCHAR(80) NOT NULL,
    CONSTRAINT fk_gate_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE push_subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    society_id INT NOT NULL,
    flat_id INT NULL,
    push_endpoint_url TEXT NOT NULL,
    public_key_p256dh VARCHAR(255) NOT NULL,
    authentication_secret VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Forward-declared society_visitors table for caller identification & photo caching
CREATE TABLE society_visitors (
    visitor_profile_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    visitor_phone_number VARCHAR(20) NOT NULL,
    visitor_full_name VARCHAR(120) NOT NULL,
    latest_photo_url VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_society_visitor_phone (society_id, visitor_phone_number),
    CONSTRAINT fk_visitor_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE visit_logs (
    visit_log_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    flat_id INT NOT NULL,
    entry_gate_id INT NULL,
    entry_guard_user_id INT NOT NULL,
    visitor_full_name VARCHAR(120) NOT NULL,
    visitor_phone_number VARCHAR(20) NOT NULL,
    visitor_category ENUM('GUEST', 'DELIVERY', 'CAB', 'SERVICE') NOT NULL,
    company_brand_name VARCHAR(80) NULL,
    vehicle_registration_number VARCHAR(30) NULL,
    visitor_photo_url VARCHAR(255) NULL,
    approval_status ENUM('PENDING', 'APPROVED', 'DENIED', 'LEAVE_AT_GATE', 'AUTO_PREAPPROVED') DEFAULT 'PENDING',
    decided_by_resident_user_id INT NULL,
    parcel_pickup_otp VARCHAR(6) NULL,
    entry_timestamp TIMESTAMP NULL,
    exit_timestamp TIMESTAMP NULL,
    exit_guard_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_visit_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    CONSTRAINT fk_visit_flat FOREIGN KEY (flat_id) REFERENCES flats(flat_id) ON DELETE CASCADE,
    INDEX idx_society_approval_status (society_id, approval_status),
    INDEX idx_flat_pending_requests (flat_id, approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pre_approvals (
    pre_approval_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    flat_id INT NOT NULL,
    created_by_resident_user_id INT NOT NULL,
    expected_visitor_name VARCHAR(120) NOT NULL,
    visitor_category ENUM('GUEST', 'DELIVERY', 'CAB', 'SERVICE') NOT NULL,
    company_brand_name VARCHAR(80) NULL,
    six_digit_passcode VARCHAR(6) NOT NULL,
    valid_from_datetime DATETIME NOT NULL,
    valid_until_datetime DATETIME NOT NULL,
    is_passcode_consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_society_active_passcode (society_id, six_digit_passcode, is_passcode_consumed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notices (
    notice_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    notice_title VARCHAR(200) NOT NULL,
    notice_body_content TEXT NOT NULL,
    published_by_admin_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notice_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =================================================================================
-- SEED DATA: 3 DEFAULT SUBSCRIPTION PLANS & 1 NIRAVAYAK GLOBAL SUPER ADMIN
-- =================================================================================

INSERT INTO subscription_plans (
    plan_id,
    plan_name,
    billing_cycle,
    base_price_inr,
    max_gates_allowed,
    photo_retention_days,
    enable_walkin_approval,
    enable_preapproval_passcode,
    enable_visitor_photo,
    enable_leave_at_gate,
    enable_notice_board
) VALUES 
(
    1,
    'Essential Gatekeeper',
    'YEARLY',
    11999.00,
    1,
    30,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE
),
(
    2,
    'Society Shield Pro',
    'YEARLY',
    23999.00,
    2,
    60,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
),
(
    3,
    'Grand Estate Enterprise',
    'YEARLY',
    44999.00,
    6,
    90,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
)
ON DUPLICATE KEY UPDATE plan_name = VALUES(plan_name);

-- Default Super Admin: Phone 9999999999, Password: SuperAdmin@Niravayak2026!
-- Werkzeug pbkdf2:sha256 hash
INSERT INTO users (
    user_id,
    society_id,
    flat_id,
    full_name,
    phone_number,
    password_hash,
    user_role,
    resident_type,
    approval_status,
    bootstrap_activation_token,
    is_bootstrap_pending,
    is_active
) VALUES (
    1,
    NULL,
    NULL,
    'Niravayak Global Super Administrator',
    '9999999999',
    'scrypt:32768:8:1$Ha9db75w6SCpeZiv$cb0e6e5be4c55d7eee9cc7d52e5c7e646b5ff6386e4a4d84e8fe909d8f07db9d79f2e51437353804df02015b18ca1745fa8d4df505d2a7616e5583c76ad13be1',
    'SUPER_ADMIN',
    NULL,
    'APPROVED',
    NULL,
    FALSE,
    TRUE
)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
