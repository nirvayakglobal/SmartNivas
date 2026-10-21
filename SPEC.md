# Smart Nivas (by Niravayak Global) — Complete Architecture & Specification (`SPEC.md`)

Save this file as **`SPEC.md`** in the root directory of your project in [Google Antigravity](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fdocs%2Fgetting-started%2F).

## 1. Clean Architectural Separation (`backend_api`, `web_application`, `mobile_application`)

The codebase separates the backend, the desktop web portals, and the dedicated mobile application into three clean, dedicated modules:

```text
smart-nivas-platform/
├── SPEC.md                                                   # Master Architecture & Database Specification
├── SKILL.md                                                  # Mandatory ACID, SOLID & Naming Coding Standards
├── passenger_wsgi.py                                         # Hostinger Python WSGI Entrypoint
│
├── backend_api/                                              # MODULE 1: PYTHON REST API (SOLID Layered Architecture)
│   ├── application_factory.py                                # Flask/FastAPI initialization & static bundle routing
│   ├── environment_configuration.py                          # Database credentials, JWT secrets, VAPID keys
│   ├── database/
│   │   ├── mysql_connection_pool_manager.py                  # ACID transaction context manager (begin/commit/rollback)
│   │   └── phase1_mysql_innodb_schema.sql                    # Complete InnoDB schema with Foreign Keys & Indexes
│   ├── middlewares/
│   │   ├── jwt_authentication_middleware.py                  # Token verification & authenticated user context
│   │   └── tenant_privacy_and_entitlement_middleware.py      # Blocks SUPER_ADMIN from society data; checks plan flags
│   ├── repositories/                                         # Data Access Layer (SQL queries only — Single Responsibility)
│   │   ├── niravayak_crm_and_licensing_repository.py         # Queries ONLY Part-A commercial tables
│   │   ├── society_topology_and_user_repository.py           # Queries wings, flats, gates, guards, and residents
│   │   └── gate_visitor_and_preapproval_repository.py        # Atomic ACID queries for visitor logs & passcodes
│   ├── services/                                             # Business Logic Layer (ACID Transaction Orchestration)
│   │   ├── authentication_and_bootstrap_service.py           # Login & zero-knowledge Society Admin activation
│   │   ├── niravayak_client_onboarding_service.py            # Lead conversion, plan assignment, invoice generation
│   │   ├── society_administration_service.py                 # Bulk flat generation, CSV resident import, guard setup
│   │   ├── gate_security_operations_service.py               # Walk-in entry, passcode verification, exit tracking
│   │   ├── resident_visitor_approval_service.py              # Atomic first-responder approval & WhatsApp pass generation
│   │   └── web_push_notification_delivery_service.py         # VAPID Web Push sender via pywebpush
│   └── controllers/                                          # HTTP Route Controllers (Request validation & JSON responses)
│       ├── authentication_controller.py                      # /api/auth/*
│       ├── niravayak_central_crm_controller.py               # /api/central/* (Strictly SUPER_ADMIN)
│       ├── society_admin_portal_controller.py                # /api/admin/*   (Strictly SOCIETY_ADMIN)
│       ├── security_guard_gate_controller.py                 # /api/guard/*   (Strictly GUARD)
│       └── resident_member_app_controller.py                 # /api/member/*  (Strictly RESIDENT)
│
├── web_application/                                          # MODULE 2: DESKTOP WEB PORTALS (100vw Desktop Dashboards)
│   ├── index.html                                            # Desktop Web Entrypoint
│   ├── src/
│   │   ├── DesktopApplicationRouter.jsx                      # Routes /central/* and /admin/*
│   │   ├── layouts/
│   │   │   └── DesktopWebPortalLayout.jsx                    # Desktop sidebar + header layout (no mobile banners)
│   │   └── sub_modules/
│   │       ├── niravayak_central_crm/                        # Module 1: Niravayak Global B2B CRM & Licensing (/central/*)
│   │       │   ├── NiravayakLeadPipelinePage.jsx
│   │       │   ├── OnboardedSocietyClientsAndEntitlementsPage.jsx
│   │       │   ├── SubscriptionPlanMasterPage.jsx
│   │       │   └── B2bGstInvoicingAndRenewalsPage.jsx
│   │       └── society_admin_portal/                         # Module 2: Society Committee ERP (/admin/*)
│   │           ├── WingAndFlatBulkGeneratorPage.jsx
│   │           ├── ResidentDirectoryAndCsvImportPage.jsx
│   │           ├── GateAndSecurityGuardSetupPage.jsx
│   │           ├── SocietyVisitorLogRegisterPage.jsx
│   │           └── SocietyDigitalNoticeBoardPage.jsx
│
└── mobile_application/                                       # MODULE 3: DEDICATED MOBILE APPLICATION (PWA / Phone Shell)
    ├── public/
    │   ├── manifest-security-guard.json                      # Standalone PWA Manifest for "Smart Nivas Gate"
    │   ├── manifest-resident-member.json                     # Standalone PWA Manifest for "Smart Nivas Resident"
    │   └── service-worker-push-notifications.js              # Background Web Push notification listener
    └── src/
        ├── MobileApplicationRouter.jsx                       # Routes /guard/* and /member/*
        ├── layouts/
        │   └── MobileStandalonePwaLayout.jsx                 # Locked 430px mobile viewport, bottom tabs, camera hooks
        ├── utilities/
        │   └── clientSideVisitorPhotoCompressor.js           # HTML5 <canvas> photo compressor (<40KB JPEG)
        └── sub_modules/
            ├── security_guard_gate_app/                      # Module 3.a: Security Guard Gate App (/guard/*)
            │   ├── SecurityGuardWalkInEntryScreen.jsx
            │   ├── SecurityGuardPasscodeVerificationScreen.jsx
            │   ├── SecurityGuardLiveGateStatusAndExitScreen.jsx
            │   └── hooks/
            │       └── useGateApprovalStatusPolling.js       # 3-second polling for pending approvals
            └── resident_member_app/                          # Module 3.b: Resident Member App (/member/*)
                ├── ResidentHomeDashboardScreen.jsx
                ├── ResidentIncomingVisitorApprovalModal.jsx
                ├── ResidentPreApproveGuestPassScreen.jsx
                ├── ResidentFlatVisitHistoryScreen.jsx
                └── hooks/
                    └── useResidentPendingVisitorPolling.js   # 3-second polling + Web Push listener
```

## 2. Deployment on 1 Hostinger Website

Both `web_application` and `mobile_application` are compiled via Vite into lightweight static bundles and served by the single Python Flask backend on Hostinger:
* **Desktop Web App (`web_application`):** Served at `https://smartnivas.com/central` and `https://smartnivas.com/admin`.
* **Mobile App (`mobile_application`):** Served at `https://smartnivas.com/guard` and `https://smartnivas.com/member` with dedicated mobile manifests (`manifest-security-guard.json` and `manifest-resident-member.json`) so users can tap **"Add to Home Screen"** to install full-screen apps with zero Google Play or Apple App Store fees.
* **Backend API (`backend_api`):** Served at `https://smartnivas.com/api/*` via Hostinger Passenger WSGI (`passenger_wsgi.py`).

## 3. ACID-Compliant MySQL InnoDB Database Schema

Every table uses `ENGINE=InnoDB` to enforce **ACID transactions**, foreign-key referential integrity, and row-level locking (`SELECT ... FOR UPDATE`).

```sql
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
```