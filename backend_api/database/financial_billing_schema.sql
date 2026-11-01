-- =================================================================================
-- SMART NIVAS: FINANCIAL & MAINTENANCE BILLING (ACCOUNTS RECEIVABLE) SCHEMA
-- Module: Society Admin ERP Maintenance & Accounts Engine
-- Engine: MySQL InnoDB, CHARSET: utf8mb4
-- =================================================================================

-- 1. Extend flats table with super_builtup_area_sqft if not already present
-- Handled safely in Python migration

-- 2. Society Billing Configuration (Rules Engine, Late Fees & Bank/UPI)
CREATE TABLE IF NOT EXISTS society_billing_configurations (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL UNIQUE,
    calculation_mode ENUM('FIXED_PER_FLAT', 'PER_SQFT_AREA') NOT NULL DEFAULT 'FIXED_PER_FLAT',
    fixed_monthly_rate_inr DECIMAL(10,2) NOT NULL DEFAULT 2000.00,
    rate_per_sqft_inr DECIMAL(10,2) NOT NULL DEFAULT 2.50,
    due_day_of_month INT NOT NULL DEFAULT 10,
    grace_period_days INT NOT NULL DEFAULT 5,
    penalty_type ENUM('FLAT_FEE', 'PERCENTAGE_MONTHLY') NOT NULL DEFAULT 'FLAT_FEE',
    penalty_amount_or_rate DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    beneficiary_name VARCHAR(150) NULL,
    bank_name VARCHAR(100) NULL,
    account_number VARCHAR(50) NULL,
    ifsc_code VARCHAR(20) NULL,
    upi_vpa VARCHAR(80) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_cfg_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Society Master Billing Heads
CREATE TABLE IF NOT EXISTS society_billing_heads (
    head_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    head_name VARCHAR(100) NOT NULL,
    default_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_head_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    UNIQUE KEY uq_soc_head_name (society_id, head_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Flat Invoices Table
CREATE TABLE IF NOT EXISTS flat_invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    flat_id INT NOT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    billing_period_month VARCHAR(20) NOT NULL, -- e.g. "2026-11"
    billing_period_label VARCHAR(50) NOT NULL, -- e.g. "November 2026"
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    base_maintenance_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    additional_heads_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    penalty_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_invoice_amount_inr DECIMAL(10,2) NOT NULL,
    paid_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    outstanding_balance_inr DECIMAL(10,2) NOT NULL,
    payment_status ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'UNPAID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_flat_inv_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    CONSTRAINT fk_flat_inv_flat FOREIGN KEY (flat_id) REFERENCES flats(flat_id) ON DELETE CASCADE,
    UNIQUE KEY uq_flat_month_inv (flat_id, billing_period_month),
    INDEX idx_soc_month_status (society_id, billing_period_month, payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Flat Invoice Line Items
CREATE TABLE IF NOT EXISTS flat_invoice_line_items (
    line_item_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    head_name VARCHAR(100) NOT NULL,
    amount_inr DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_item_inv FOREIGN KEY (invoice_id) REFERENCES flat_invoices(invoice_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Flat Payments (Credits / Receipts)
CREATE TABLE IF NOT EXISTS flat_payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    flat_id INT NOT NULL,
    invoice_id INT NULL,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    amount_paid_inr DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('CASH', 'CHEQUE', 'UPI', 'NEFT_IMPS') NOT NULL DEFAULT 'UPI',
    transaction_reference VARCHAR(100) NULL,
    cheque_number VARCHAR(50) NULL,
    cheque_date DATE NULL,
    bank_name VARCHAR(100) NULL,
    deposit_slip_image_url VARCHAR(255) NULL,
    payment_date DATE NOT NULL,
    notes TEXT NULL,
    recorded_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_flat FOREIGN KEY (flat_id) REFERENCES flats(flat_id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES flat_invoices(invoice_id) ON DELETE SET NULL,
    CONSTRAINT fk_pay_recorder FOREIGN KEY (recorded_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Flat Ledger Entries (Real-Time Account Statement)
CREATE TABLE IF NOT EXISTS flat_ledger_entries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    flat_id INT NOT NULL,
    entry_date DATE NOT NULL,
    entry_type ENUM('INVOICE_DEBIT', 'PAYMENT_CREDIT', 'PENALTY_DEBIT', 'ADJUSTMENT_CREDIT') NOT NULL,
    reference_id VARCHAR(60) NOT NULL,
    description VARCHAR(255) NOT NULL,
    debit_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    credit_amount_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    running_balance_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledg_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    CONSTRAINT fk_ledg_flat FOREIGN KEY (flat_id) REFERENCES flats(flat_id) ON DELETE CASCADE,
    INDEX idx_flat_ledger (flat_id, entry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
