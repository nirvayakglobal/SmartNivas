-- =================================================================================
-- SMART NIVAS: EXPENSE MANAGEMENT & ACCOUNTS PAYABLE SCHEMA
-- Module: Society Admin ERP Accounts Payable Engine
-- Engine: MySQL InnoDB, CHARSET: utf8mb4
-- =================================================================================

-- 1. Chart of Accounts (Custom Expense Heads)
CREATE TABLE IF NOT EXISTS society_expense_heads (
    expense_head_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    category_code VARCHAR(50) NOT NULL DEFAULT 'OPERATING_EXPENSE', -- e.g. UTILITIES, REPAIRS, SALARIES, ADMINISTRATIVE
    head_name VARCHAR(120) NOT NULL,                               -- e.g. Diesel for Generator, Lift Maintenance, Security Salaries
    description VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_exphead_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    UNIQUE KEY uq_soc_exphead (society_id, head_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TDS Tax Rates Configuration
CREATE TABLE IF NOT EXISTS society_tds_tax_configurations (
    tds_config_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    section_code VARCHAR(30) NOT NULL,       -- e.g. "194C_INDIVIDUAL", "194C_COMPANY", "194J_PROFESSIONAL"
    vendor_type VARCHAR(80) NOT NULL,        -- e.g. "Contractor - Individual", "Contractor - Company", "Professional / Technical"
    tds_percentage DECIMAL(5,2) NOT NULL,    -- e.g. 1.00, 2.00, 10.00
    threshold_limit_inr DECIMAL(12,2) NOT NULL DEFAULT 30000.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tds_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Vendor Directory
CREATE TABLE IF NOT EXISTS society_vendors (
    vendor_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    vendor_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(100) NULL,
    vendor_type VARCHAR(80) NOT NULL DEFAULT 'Contractor - Company',
    gstin VARCHAR(25) NULL,
    pan_number VARCHAR(20) NULL,
    default_tds_config_id INT NULL,
    bank_name VARCHAR(100) NULL,
    bank_account_number VARCHAR(50) NULL,
    bank_ifsc_code VARCHAR(20) NULL,
    upi_id VARCHAR(80) NULL,
    service_description VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendor_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    CONSTRAINT fk_vendor_tds FOREIGN KEY (default_tds_config_id) REFERENCES society_tds_tax_configurations(tds_config_id) ON DELETE SET NULL,
    INDEX idx_vendor_soc_status (society_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Annual Maintenance Contracts (AMC Tracker)
CREATE TABLE IF NOT EXISTS society_amc_contracts (
    amc_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    vendor_id INT NOT NULL,
    expense_head_id INT NOT NULL,
    contract_title VARCHAR(150) NOT NULL, -- e.g. "Schindler Lift Comprehensive AMC"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    contract_value_inr DECIMAL(12,2) NOT NULL,
    billing_frequency ENUM('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUALLY') NOT NULL DEFAULT 'QUARTERLY',
    contract_document_url VARCHAR(255) NULL,
    notes TEXT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_amc_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    CONSTRAINT fk_amc_vendor FOREIGN KEY (vendor_id) REFERENCES society_vendors(vendor_id) ON DELETE CASCADE,
    CONSTRAINT fk_amc_expense_head FOREIGN KEY (expense_head_id) REFERENCES society_expense_heads(expense_head_id) ON DELETE RESTRICT,
    INDEX idx_amc_soc_dates (society_id, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Expense Vouchers (Accounts Payable Journal)
CREATE TABLE IF NOT EXISTS society_expense_vouchers (
    voucher_id INT AUTO_INCREMENT PRIMARY KEY,
    society_id INT NOT NULL,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    voucher_date DATE NOT NULL,
    vendor_id INT NULL,
    expense_head_id INT NOT NULL,
    amc_id INT NULL,
    gross_amount_inr DECIMAL(12,2) NOT NULL,
    tds_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tds_deducted_amount_inr DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    net_payable_amount_inr DECIMAL(12,2) NOT NULL,
    payment_mode ENUM('BANK_TRANSFER', 'CHEQUE', 'UPI', 'PETTY_CASH') NOT NULL DEFAULT 'BANK_TRANSFER',
    payment_reference_number VARCHAR(100) NULL,
    payment_date DATE NOT NULL,
    invoice_bill_number VARCHAR(100) NULL,
    invoice_attachment_url LONGTEXT NULL, -- Supports data URL or relative uploaded path
    invoice_attachment_filename VARCHAR(255) NULL,
    payment_status ENUM('PAID', 'PENDING', 'CANCELLED') NOT NULL DEFAULT 'PAID',
    remarks TEXT NULL,
    recorded_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vch_society FOREIGN KEY (society_id) REFERENCES societies(society_id) ON DELETE CASCADE,
    CONSTRAINT fk_vch_vendor FOREIGN KEY (vendor_id) REFERENCES society_vendors(vendor_id) ON DELETE SET NULL,
    CONSTRAINT fk_vch_head FOREIGN KEY (expense_head_id) REFERENCES society_expense_heads(expense_head_id) ON DELETE RESTRICT,
    CONSTRAINT fk_vch_amc FOREIGN KEY (amc_id) REFERENCES society_amc_contracts(amc_id) ON DELETE SET NULL,
    INDEX idx_vch_soc_date (society_id, voucher_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
