-- ==============================================================================
-- AutoTrack: Automotive Production Monitoring System - Database Schema
-- Database: autotrack_db
-- Target: MySQL 8.0+ / 9.x | Storage Engine: InnoDB | Charset: utf8mb4
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS autotrack_db;
USE autotrack_db;

-- ------------------------------------------------------------------------------
-- A. PLANTS (Automotive Manufacturing Facilities)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plants (
    plant_id INT AUTO_INCREMENT PRIMARY KEY,
    plant_code VARCHAR(20) NOT NULL UNIQUE,
    plant_name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'USA',
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Detroit',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_plants_code (plant_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backward-compatibility view/table for factories
CREATE TABLE IF NOT EXISTS factories (
    factory_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_factories_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- C. ROLES (RBAC Roles: Admin, Manager, Operator, Viewer)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- B. USERS (Application Users & Credentials)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NULL,
    role ENUM('ADMIN', 'OPERATOR', 'VIEWER') NOT NULL DEFAULT 'OPERATOR',
    first_name VARCHAR(50) NULL,
    last_name VARCHAR(50) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_plant FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- D. PRODUCTION LINES (Robotic & Assembly Lines)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_lines (
    line_id INT AUTO_INCREMENT PRIMARY KEY,
    factory_id INT NULL,
    plant_id INT NULL,
    line_code VARCHAR(50) NULL,
    name VARCHAR(100) NOT NULL,
    line_name VARCHAR(100) NULL,
    description VARCHAR(255) NULL,
    capacity_per_shift INT NOT NULL DEFAULT 450,
    production_capacity INT NOT NULL DEFAULT 450,
    status ENUM('RUNNING', 'IDLE', 'MAINTENANCE', 'STOPPED') NOT NULL DEFAULT 'RUNNING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lines_plant FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_lines_plant (plant_id),
    INDEX idx_lines_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- E. VEHICLE MODELS (Products being manufactured)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_models (
    model_id INT AUTO_INCREMENT PRIMARY KEY,
    model_code VARCHAR(30) NOT NULL UNIQUE,
    model_name VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL DEFAULT 'AutoTrack Motors',
    ideal_cycle_time_seconds DECIMAL(6, 2) NOT NULL DEFAULT 60.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_models_code (model_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- F. WORK ORDERS (Production Batches)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_orders (
    work_order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NOT NULL,
    line_id INT NOT NULL,
    model_id INT NOT NULL,
    work_order_number VARCHAR(50) NOT NULL UNIQUE,
    planned_quantity INT NOT NULL,
    actual_quantity INT NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    status ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wo_plant FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_wo_line FOREIGN KEY (line_id) REFERENCES production_lines(line_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_wo_model FOREIGN KEY (model_id) REFERENCES vehicle_models(model_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_wo_plant (plant_id),
    INDEX idx_wo_line (line_id),
    INDEX idx_wo_status (status),
    INDEX idx_wo_number (work_order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- G. PRODUCTION RECORDS (Shift-by-Shift Throughput Logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    line_id INT NOT NULL,
    work_order_id BIGINT NULL,
    model_id INT NULL,
    production_date DATE NOT NULL,
    shift ENUM('MORNING', 'EVENING', 'NIGHT') NOT NULL,
    target_quantity INT NOT NULL,
    planned_quantity INT NULL,
    produced_quantity INT NOT NULL,
    actual_quantity INT NULL,
    good_quantity INT NOT NULL DEFAULT 0,
    defective_quantity INT NOT NULL DEFAULT 0,
    defect_count INT NOT NULL DEFAULT 0,
    rejected_quantity INT NOT NULL DEFAULT 0,
    downtime_minutes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_target_positive CHECK (target_quantity >= 0),
    CONSTRAINT chk_produced_positive CHECK (produced_quantity >= 0),
    CONSTRAINT chk_defects_positive CHECK (defect_count >= 0),
    CONSTRAINT chk_downtime_positive CHECK (downtime_minutes >= 0),
    CONSTRAINT uq_line_date_shift UNIQUE (line_id, production_date, shift),
    CONSTRAINT fk_records_line FOREIGN KEY (line_id) REFERENCES production_lines(line_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_records_line (line_id),
    INDEX idx_records_date (production_date),
    INDEX idx_records_shift (shift)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- H. DEFECT CATEGORIES (Standardized Quality Classifications)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS defect_categories (
    defect_category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    severity_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- I. QUALITY INSPECTIONS (Vehicle End-of-Line Audit Audits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quality_inspections (
    inspection_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    production_id INT NOT NULL,
    work_order_id BIGINT NULL,
    line_id INT NULL,
    inspected_quantity INT NOT NULL DEFAULT 0,
    accepted_quantity INT NOT NULL DEFAULT 0,
    passed_quantity INT NOT NULL DEFAULT 0,
    rejected_quantity INT NOT NULL DEFAULT 0,
    failed_quantity INT NOT NULL DEFAULT 0,
    inspection_status ENUM('ACCEPTED', 'REJECTED', 'PENDING') NOT NULL DEFAULT 'ACCEPTED',
    inspector_id INT NULL,
    inspection_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_qi_production FOREIGN KEY (production_id) REFERENCES production_records(record_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_qi_prod (production_id),
    INDEX idx_qi_status (inspection_status),
    INDEX idx_qi_date (inspection_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- J. QUALITY ISSUES (Defect Tickets & Resolution Workflows)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quality_issues (
    issue_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    inspection_id BIGINT NULL,
    defect_category_id INT NULL,
    assigned_to INT NULL,
    category ENUM('PAINT', 'WELD', 'ASSEMBLY', 'ELECTRICAL', 'ALIGNMENT', 'TRIM', 'OTHER') NOT NULL DEFAULT 'OTHER',
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW',
    status ENUM('OPEN', 'IN_REVIEW', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    description TEXT NOT NULL,
    issue_description TEXT NULL,
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_issues_record FOREIGN KEY (record_id) REFERENCES production_records(record_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_issues_defect_cat FOREIGN KEY (defect_category_id) REFERENCES defect_categories(defect_category_id) ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_issues_record (record_id),
    INDEX idx_issues_status (status),
    INDEX idx_issues_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- K. EQUIPMENT (Robotic Cells & Machinery)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id INT AUTO_INCREMENT PRIMARY KEY,
    line_id INT NOT NULL,
    equipment_code VARCHAR(50) NOT NULL UNIQUE,
    equipment_name VARCHAR(100) NOT NULL,
    equipment_type VARCHAR(50) NOT NULL,
    status ENUM('RUNNING', 'MAINTENANCE', 'STOPPED', 'STANDBY') NOT NULL DEFAULT 'RUNNING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipment_line FOREIGN KEY (line_id) REFERENCES production_lines(line_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_equipment_line (line_id),
    INDEX idx_equipment_code (equipment_code),
    INDEX idx_equipment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- L. DOWNTIME RECORDS (Stoppage Events & Lost Production Time)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS downtime_records (
    downtime_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    production_id INT NULL,
    line_id INT NULL,
    downtime_start DATETIME NOT NULL,
    start_time DATETIME NULL,
    downtime_end DATETIME NULL,
    end_time DATETIME NULL,
    duration_minutes INT NOT NULL DEFAULT 0,
    downtime_reason VARCHAR(255) NOT NULL,
    reason VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dt_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dt_production FOREIGN KEY (production_id) REFERENCES production_records(record_id) ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_dt_equipment (equipment_id),
    INDEX idx_dt_production (production_id),
    INDEX idx_dt_start (downtime_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
