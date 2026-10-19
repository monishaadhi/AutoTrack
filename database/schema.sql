-- AutoTrack: Automotive Production Monitoring Database Schema
-- Target Database: MySQL 8.0+ / 9.x
-- Engine: InnoDB, Charset: utf8mb4

CREATE DATABASE IF NOT EXISTS autotrack;
USE autotrack;

-- 1. FACTORIES
-- Represents manufacturing and vehicle assembly facilities
CREATE TABLE IF NOT EXISTS factories (
    factory_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_factories_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PRODUCTION LINES
-- Assembly and fabrication lines linked to a factory
CREATE TABLE IF NOT EXISTS production_lines (
    line_id INT AUTO_INCREMENT PRIMARY KEY,
    factory_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    status ENUM('RUNNING', 'IDLE', 'MAINTENANCE', 'STOPPED') NOT NULL DEFAULT 'RUNNING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lines_factory 
        FOREIGN KEY (factory_id) REFERENCES factories(factory_id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
    INDEX idx_lines_factory (factory_id),
    INDEX idx_lines_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PRODUCTION RECORDS
-- Production metrics logged per line per shift per day
CREATE TABLE IF NOT EXISTS production_records (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    line_id INT NOT NULL,
    production_date DATE NOT NULL,
    shift ENUM('Morning', 'Evening', 'Night') NOT NULL,
    target_quantity INT NOT NULL,
    produced_quantity INT NOT NULL,
    defect_count INT NOT NULL DEFAULT 0,
    downtime_minutes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Prevent negative quantities, defect counts, and downtime
    CONSTRAINT chk_target_positive CHECK (target_quantity >= 0),
    CONSTRAINT chk_produced_positive CHECK (produced_quantity >= 0),
    CONSTRAINT chk_defects_positive CHECK (defect_count >= 0),
    CONSTRAINT chk_downtime_positive CHECK (downtime_minutes >= 0),
    -- Business rule: At most one production record per line per shift per calendar date
    CONSTRAINT uq_line_date_shift UNIQUE (line_id, production_date, shift),
    CONSTRAINT fk_records_line 
        FOREIGN KEY (line_id) REFERENCES production_lines(line_id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
    INDEX idx_records_line (line_id),
    INDEX idx_records_date (production_date),
    INDEX idx_records_shift (shift),
    INDEX idx_records_line_date (line_id, production_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. QUALITY ISSUES
-- Specific defects discovered during inspection linked to a production record
CREATE TABLE IF NOT EXISTS quality_issues (
    issue_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_id BIGINT NOT NULL,
    category ENUM('Paint', 'Weld', 'Torque', 'Electronics', 'Alignment', 'Trim') NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Low',
    status ENUM('OPEN', 'IN_REVIEW', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_issues_record 
        FOREIGN KEY (record_id) REFERENCES production_records(record_id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
    INDEX idx_issues_record (record_id),
    INDEX idx_issues_status (status),
    INDEX idx_issues_severity (severity),
    INDEX idx_issues_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
