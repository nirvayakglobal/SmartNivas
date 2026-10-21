# Master Prompt & 5-Milestone Execution Guide for Google Antigravity IDE

Before running these prompts in [Google Antigravity](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fdocs%2Fgetting-started%2F), place the two companion files in your project root folder:
1. **`SPEC.md`** *(from the Smart Nivas Phase 1 Architecture & Specification document)*
2. **`SKILL.md`** *(from the Smart Nivas Mandatory Coding Standards, ACID & SOLID Skill document)*

Then open the Antigravity Agent prompt box (`Ctrl + N` / `⌘ + N`) and paste **Prompts 1 through 5** one milestone at a time.

## Prompt 1: Master Architecture, ACID/SOLID Enforcement & Milestone 1 (`backend_api` Core)

Copy and paste the entire block below as your first prompt in Google Antigravity:

```text
You are building "Smart Nivas", a multi-tenant B2B SaaS housing society and visitor management platform owned and operated by "Niravayak Global".

Before writing a single line of code, read `SPEC.md` and `SKILL.md` in the project root and follow every rule strictly:

### 1. ARCHITECTURE & FOLDER STRUCTURE (SEPARATE WEB & MOBILE MODULES)
All code must be structured into three dedicated top-level modules:
1. `backend_api/` -> Python Flask REST API using SOLID layered architecture (`controllers/`, `services/`, `repositories/`, `middlewares/`, `database/`) and a root `passenger_wsgi.py` for Hostinger single-website deployment.
2. `web_application/` -> Desktop Web Portals wrapped in `DesktopWebPortalLayout.jsx`:
   - `sub_modules/niravayak_central_crm/` (Module 1: `/central/*` for Niravayak Global Super Admin)
   - `sub_modules/society_admin_portal/` (Module 2: `/admin/*` for Society Managing Committee)
3. `mobile_application/` -> Dedicated Mobile Application (PWA / Mobile Shell) wrapped in `MobileStandalonePwaLayout.jsx` with dedicated manifests (`manifest-security-guard.json` and `manifest-resident-member.json`):
   - `sub_modules/security_guard_gate_app/` (Module 3.a: `/guard/*` for Gate Security Guards)
   - `sub_modules/resident_member_app/` (Module 3.b: `/member/*` for Society Residents)

### 2. MANDATORY CODING STANDARDS, ACID & SOLID PRINCIPLES (FROM `SKILL.md`)
- ZERO SINGLE-LETTER OR CRYPTIC VARIABLES: Never use variable names like `a`, `b`, `x`, `i`, `r`, `soc`, `res`, `req`, `for a in ...`, or `.map(x => ...)`. Always use full, self-documenting domain names (`for flat_record in society_flat_records:`, `activeVisitorEntries.map((visitorEntryItem) => ...)`).
- DESCRIPTIVE FILE NAMES ONLY: Never name files `db.py`, `utils.py`, `admin.py`, or `Modal.jsx`. Use exact descriptive names from `SPEC.md` (e.g., `mysql_connection_pool_manager.py`, `tenant_privacy_and_entitlement_middleware.py`, `SecurityGuardWalkInEntryScreen.jsx`).
- ACID TRANSACTIONS: Every database table must use `ENGINE=InnoDB`. Every multi-step write operation must run inside an atomic transaction context manager (`with database_transaction_scope() as database_cursor:`) that commits on success and rolls back on any error. Use `SELECT ... FOR UPDATE` or atomic conditional `UPDATE` for concurrent approvals and passcode checks.
- SOLID ARCHITECTURE: Controllers only handle HTTP request/response; Services handle business logic and ACID transactions; Repositories execute parameterized SQL queries. Inject repositories into services.
- STRICT PRIVACY WALL: Niravayak Global (`SUPER_ADMIN`) can only access Part-A commercial tables (`subscription_plans`, `crm_leads`, `societies`, `b2b_invoices`) and is blocked (HTTP 403) from reading `wings`, `flats`, `visit_logs`, `notices`, or society residents/guards.

### 3. MILESTONE 1 TASK (EXECUTE NOW)
Implement the Backend Core Foundation inside `backend_api/`:
1. Create `backend_api/database/phase1_mysql_innodb_schema.sql` with all 11 InnoDB tables from `SPEC.md` plus seed data for 1 Niravayak Global Super Admin and 3 default plans.
2. Create `backend_api/environment_configuration.py` and `backend_api/database/mysql_connection_pool_manager.py` (providing `database_transaction_scope()` with explicit `begin()`, `commit()`, and `rollback()`).
3. Create `backend_api/middlewares/jwt_authentication_middleware.py` and `backend_api/middlewares/tenant_privacy_and_entitlement_middleware.py`.
4. Create `backend_api/repositories/society_topology_and_user_repository.py`, `backend_api/services/authentication_and_bootstrap_service.py`, and `backend_api/controllers/authentication_controller.py` (`/api/auth/login` and `/api/auth/activate-society-admin`).
5. Create `backend_api/application_factory.py` and root `passenger_wsgi.py`.
6. Run a verification check confirming zero single-letter variables exist and that the privacy middleware blocks `SUPER_ADMIN` from society endpoints. Stop after Milestone 1 and summarize.
```

## Prompt 2: Milestone 2 — Web Application: Niravayak Central CRM (`web_application`)

Once Milestone 1 is verified, paste this prompt:

```text
Now execute Milestone 2: Build Niravayak Central CRM inside `web_application/src/sub_modules/niravayak_central_crm/` (`/central/*`), strictly following `SPEC.md` and `SKILL.md` (SOLID layers, ACID transactions, descriptive file names, and zero single-letter variables).

1. Backend API (`backend_api/`):
   - `repositories/niravayak_crm_and_licensing_repository.py`: Parameterized SQL queries restricted exclusively to `subscription_plans`, `crm_leads`, `societies`, `b2b_invoices`, and creating the initial `SOCIETY_ADMIN` bootstrap record in `users`.
   - `services/niravayak_client_onboarding_service.py`: ACID transaction that converts a won lead or registers a new society client, copies plan feature flags to `societies`, creates the `SOCIETY_ADMIN` user with `is_bootstrap_pending = TRUE` and a secure `bootstrap_activation_token`, and generates the initial `b2b_invoices` record atomically.
   - `controllers/niravayak_central_crm_controller.py`: Routes for `/api/central/leads`, `/api/central/plans`, `/api/central/clients`, and `/api/central/invoices` protected by `@require_super_admin`.

2. Desktop Web Portal (`web_application/`):
   - Create `src/layouts/DesktopWebPortalLayout.jsx` (full-width desktop layout with left sidebar and top bar).
   - Inside `src/sub_modules/niravayak_central_crm/`, create:
     a) `NiravayakLeadPipelinePage.jsx`
     b) `OnboardedSocietyClientsAndEntitlementsPage.jsx` (allows toggling `enable_walkin_approval`, `enable_preapproval_passcode`, `enable_visitor_photo`, `enable_leave_at_gate`, `enable_notice_board`, changing `license_status`, and copying the Society Admin one-time activation link)
     c) `SubscriptionPlanMasterPage.jsx`
     d) `B2bGstInvoicingAndRenewalsPage.jsx`
```

## Prompt 3: Milestone 3 — Web Application: Society Admin Portal (`web_application`)

Once Milestone 2 is verified, paste this prompt:

```text
Now execute Milestone 3: Build Society Admin Portal inside `web_application/src/sub_modules/society_admin_portal/` (`/admin/*`), strictly following `SPEC.md` and `SKILL.md`.

1. Backend API (`backend_api/`):
   - Expand `repositories/society_topology_and_user_repository.py` with methods for wings, flats, residents, gates, guards, visitor logs, and society notices scoped strictly by `authenticated_user_context.society_id`.
   - `services/society_administration_service.py`:
     a) ACID transaction for bulk-generating wings and flats (e.g., Floor 1 to 10, Flats 1 to 4 -> rolls back completely if a duplicate flat conflict occurs).
     b) ACID transaction for bulk CSV resident import (`wing_name, flat_number, full_name, phone_number, resident_type`).
     c) Gate creation enforcing `max_gates_allowed` from the society's active entitlements, plus Security Guard 4-digit PIN account creation.
   - `controllers/society_admin_portal_controller.py`: Routes under `/api/admin/*` protected by `@require_society_permission(allowed_roles=['SOCIETY_ADMIN'])`.

2. Desktop Web Portal (`web_application/`):
   - Inside `src/sub_modules/society_admin_portal/` (wrapped in `DesktopWebPortalLayout.jsx`), create:
     a) `WingAndFlatBulkGeneratorPage.jsx`
     b) `ResidentDirectoryAndCsvImportPage.jsx`
     c) `GateAndSecurityGuardSetupPage.jsx`
     d) `SocietyVisitorLogRegisterPage.jsx`
     e) `SocietyDigitalNoticeBoardPage.jsx` (dynamically hidden in `DesktopWebPortalLayout.jsx` if `enable_notice_board` is false for the society).
```

## Prompt 4: Milestone 4 — Mobile Application: Security Guard Gate App (`mobile_application`)

Once Milestone 3 is verified, paste this prompt:

```text
Now execute Milestone 4: Build the Security Guard Gate App inside `mobile_application/src/sub_modules/security_guard_gate_app/` (`/guard/*`), strictly following `SPEC.md` and `SKILL.md`.

1. Backend API (`backend_api/`):
   - `repositories/gate_visitor_and_preapproval_repository.py`: Queries for visitor phone auto-fill (`society_visitors`), inserting `visit_logs`, locking and consuming 6-digit passcodes (`SELECT ... FOR UPDATE`), querying active/inside visitors, and marking visitor exit or parcel handover.
   - `services/gate_security_operations_service.py`:
     a) Walk-in visitor entry (checks `enable_walkin_approval` and `enable_visitor_photo`, saves compressed photo to `/uploads/visitors/{society_id}/`, upserts `society_visitors`, inserts `PENDING` visit log, and triggers Web Push to flat residents).
     b) Atomic ACID passcode verification (checks `enable_preapproval_passcode`, locks `pre_approvals` row with `FOR UPDATE`, marks `is_passcode_consumed = TRUE`, and creates `AUTO_PREAPPROVED` visit log).
   - `controllers/security_guard_gate_controller.py`: Routes under `/api/guard/*` protected by `@require_society_permission(allowed_roles=['GUARD'])`.

2. Dedicated Mobile Application (`mobile_application/`):
   - Create `src/layouts/MobileStandalonePwaLayout.jsx` (locked 430px mobile frame, high-contrast header, bottom tab bar) and `public/manifest-security-guard.json`.
   - Create `src/utilities/clientSideVisitorPhotoCompressor.js` (HTML5 `<canvas>` compression to <40KB JPEG).
   - Inside `src/sub_modules/security_guard_gate_app/`, create:
     a) `SecurityGuardWalkInEntryScreen.jsx`
     b) `SecurityGuardPasscodeVerificationScreen.jsx`
     c) `SecurityGuardLiveGateStatusAndExitScreen.jsx`
     d) `hooks/useGateApprovalStatusPolling.js` (3-second short-polling for pending approvals and currently inside visitors).
```

## Prompt 5: Milestone 5 — Mobile Application: Resident Member App (`mobile_application`) & Deployment

Once Milestone 4 is verified, paste this final prompt:

```text
Now execute Milestone 5: Build the Resident Member App inside `mobile_application/src/sub_modules/resident_member_app/` (`/member/*`), Web Push Service Worker, and Hostinger Deployment Packaging, strictly following `SPEC.md` and `SKILL.md`.

1. Backend API (`backend_api/`):
   - `services/web_push_notification_delivery_service.py`: Sends VAPID Web Push alerts (`pywebpush`) to all registered family members of a flat.
   - `services/resident_visitor_approval_service.py`:
     a) Atomic first-responder visitor decision (`APPROVED`, `DENIED`, `LEAVE_AT_GATE`) using conditional SQL update (`WHERE visit_log_id = %s AND flat_id = %s AND approval_status = 'PENDING'`). Generates a 6-digit `parcel_pickup_otp` when `LEAVE_AT_GATE` is selected. Returns HTTP 409 if another family member already responded.
     b) Pre-approval passcode generation for expected guests/deliveries.
   - `controllers/resident_member_app_controller.py`: Routes under `/api/member/*` protected by `@require_society_permission(allowed_roles=['RESIDENT'])`.

2. Dedicated Mobile Application (`mobile_application/`):
   - Create `public/manifest-resident-member.json` and `public/service-worker-push-notifications.js`.
   - Inside `src/sub_modules/resident_member_app/`, create:
     a) `ResidentHomeDashboardScreen.jsx` (with "Install Smart Nivas App" and "Enable Gate Alerts" banners)
     b) `ResidentIncomingVisitorApprovalModal.jsx` (full-screen ringing alert modal with visitor photo, category badge, and Approve / Deny / Leave at Gate buttons)
     c) `ResidentPreApproveGuestPassScreen.jsx` (generates 6-digit passcode card with one-tap "Share on WhatsApp" button)
     d) `ResidentFlatVisitHistoryScreen.jsx`
     e) `hooks/useResidentPendingVisitorPolling.js`

3. Final Audit & Hostinger Packaging:
   - Verify that `web_application` and `mobile_application` are independently buildable and cleanly served by `backend_api/application_factory.py`.
   - Audit every Python and JS/JSX file against `SKILL.md` to verify: (1) zero single-letter variable names (`a`, `b`, `x`, `i`), (2) all multi-step writes use ACID transactions, (3) strict SOLID separation between Controllers, Services, and Repositories, and (4) `DEPLOYMENT_HOSTINGER.md` is generated.
```