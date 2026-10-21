---
name: smart-nivas-engineering-standards
description: Mandatory coding standards, ACID database transaction rules, SOLID architecture principles, and strict file/variable naming conventions for Smart Nivas (by Niravayak Global).
---

# Smart Nivas — Mandatory Coding Standards, ACID & SOLID Skill (`SKILL.md`)

Save this file as **`SKILL.md`** in your project root (or inside `.agent/rules/smart_nivas_standards.md`) in [Google Antigravity](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fdocs%2Fgetting-started%2F). Every file generated or edited by the agent MUST pass all rules below.

## 1. Strict Variable, Function & File Naming Conventions (ZERO Single-Letter Variables)

1. **Cryptic & Single-Letter Variable Names Are Strictly Forbidden:**
   - **NEVER** use single-letter or abbreviated variable names such as `a`, `b`, `c`, `x`, `y`, `i`, `j`, `r`, `u`, `s`, `soc`, `res`, `req`, `arr`, `obj`, `val`, or `temp`—including inside `for` loops, list comprehensions, `.map()`, `.filter()`, or `try/except` blocks.
   - **Forbidden Python Examples:**
     ```python
     # FORBIDDEN:
     for a in flats:
     for i, r in enumerate(rows):
     soc = cursor.fetchone()
     ```
   - **Required Python Examples:**
     ```python
     # REQUIRED:
     for flat_record in society_flat_records:
     for row_index, resident_csv_row in enumerate(uploaded_resident_rows):
     society_entitlement_record = database_cursor.fetchone()
     ```
   - **Forbidden React/JavaScript Examples:**
     ```javascript
     // FORBIDDEN:
     visitors.map((v, i) => <div key={i}>{v.name}</div>)
     const res = await fetch(url);
     ```
   - **Required React/JavaScript Examples:**
     ```javascript
     // REQUIRED:
     activeVisitorEntries.map((visitorEntryItem) => (
       <VisitorEntryCard key={visitorEntryItem.visit_log_id} visitorEntry={visitorEntryItem} />
     ))
     const httpApiResponse = await fetch(visitRequestEndpointUrl);
     ```

2. **Self-Explanatory, Domain-Specific File Names:**
   - Every file name MUST clearly state its domain module and architectural responsibility.
   - **Forbidden Generic File Names:** `utils.py`, `helpers.py`, `db.py`, `models.py`, `admin.py`, `guard.py`, `index.jsx`, `Page1.jsx`, `Modal.jsx`.
   - **Required Descriptive File Names:**
     - Backend Python (`snake_case`): `<domain>_<layer>.py` (e.g., `niravayak_central_crm_controller.py`, `society_administration_service.py`, `gate_visitor_and_preapproval_repository.py`, `mysql_connection_pool_manager.py`).
     - Frontend React Components (`PascalCase`): `<RoleOrDomain><Feature><ComponentType>.jsx` (e.g., `SecurityGuardWalkInEntryScreen.jsx`, `ResidentIncomingVisitorApprovalModal.jsx`, `WingAndFlatBulkGeneratorPage.jsx`).
     - Frontend Hooks & Utilities (`camelCase`): `useGateApprovalStatusPolling.js`, `clientSideVisitorPhotoCompressor.js`.

## 2. Mandatory ACID Database Transaction Principles

All write operations in `backend_api/services/` and `backend_api/repositories/` MUST uphold **ACID** properties on MySQL InnoDB:

1. **Atomicity (All-or-Nothing Transactions):**
   - Multi-statement workflows (such as converting a CRM lead into a society client + creating the root `SOCIETY_ADMIN` user + creating a `b2b_invoices` record; or bulk-generating wings and flats; or validating a `pre_approvals` passcode + marking `is_passcode_consumed = TRUE` + inserting into `visit_logs`) MUST run inside a single `with database_transaction_scope() as database_cursor:` context manager.
   - If any step raises an exception, the context manager MUST execute `connection.rollback()` before re-raising a structured domain error.

2. **Consistency (Schema & Domain Invariants):**
   - Validate all incoming payloads at the controller boundary before opening a database transaction.
   - Never bypass MySQL foreign keys, `UNIQUE` constraints, or `ENUM` statuses.

3. **Isolation (Row-Level Locking & Race-Condition Prevention):**
   - **Resident Visitor Decision Race Condition:** When two family members tap Approve/Deny simultaneously, use an atomic conditional update (`UPDATE visit_logs SET approval_status = %s, decided_by_resident_user_id = %s WHERE visit_log_id = %s AND flat_id = %s AND approval_status = 'PENDING'`) and check `database_cursor.rowcount == 1`.
   - **Passcode Consumption Race Condition:** When a guard verifies a 6-digit guest passcode, lock the row using `SELECT ... FROM pre_approvals WHERE society_id = %s AND six_digit_passcode = %s AND is_passcode_consumed = FALSE FOR UPDATE` inside the transaction before marking it consumed.

4. **Durability:**
   - Every table in `phase1_mysql_innodb_schema.sql` MUST explicitly declare `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`.

## 3. Mandatory SOLID Architecture Principles

1. **Single Responsibility Principle (SRP):**
   - **Controllers (`backend_api/controllers/`):** Only parse HTTP requests, validate input fields, call a Service method, and return HTTP JSON status codes. Zero SQL queries inside controllers.
   - **Services (`backend_api/services/`):** Own business rules, feature-flag checks, and ACID transaction boundaries. Zero raw SQL strings inside services.
   - **Repositories (`backend_api/repositories/`):** Execute parameterized SQL queries (`%s` placeholders only—never f-strings in SQL) and return typed dictionaries.
   - **React Components:** Separate visual presentation components from polling/API state hooks (`useGateApprovalStatusPolling.js`, `useResidentPendingVisitorPolling.js`).

2. **Open/Closed Principle (OCP):**
   - Enforce society subscription feature flags (`enable_walkin_approval`, `enable_preapproval_passcode`, `enable_visitor_photo`, `enable_leave_at_gate`, `enable_notice_board`) declaratively via `@require_society_permission(allowed_roles=[...], required_feature_flag='...')` middleware so adding new subscription plans requires zero changes to controller code.

3. **Liskov Substitution Principle (LSP) & Dependency Inversion Principle (DIP):**
   - Services must receive their repository and notification dependencies via constructor injection (`ResidentVisitorApprovalService(visitor_repository, notification_service)`), allowing easy unit testing with mock repositories.

4. **Interface Segregation Principle (ISP):**
   - Never return raw database rows containing `password_hash` or `bootstrap_activation_token` to the frontend. Map records into role-specific response dictionaries (`serialize_society_client_for_super_admin`, `serialize_visit_log_for_guard`).

## 4. Architectural Boundaries

1. **`backend_api/`** contains all Python WSGI, service, repository, and SQL code.
2. **`web_application/`** contains ONLY the desktop web portals (`niravayak_central_crm/` and `society_admin_portal/`) wrapped in `DesktopWebPortalLayout.jsx`.
3. **`mobile_application/`** contains ONLY the dedicated mobile application (`security_guard_gate_app/` and `resident_member_app/`) wrapped in `MobileStandalonePwaLayout.jsx`.