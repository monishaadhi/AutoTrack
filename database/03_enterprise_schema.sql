-- AutoTrack: Enterprise Manufacturing Schema Migration (Step 03)
-- Target Database: MySQL 8.0+ / 9.x
-- Engine: InnoDB, Charset: utf8mb4

USE autotrack_db;

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PLANTS (Enhances factories concept with enterprise manufacturing fields)
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

-- Ensure factories table exists and sync with plants
SET @has_plant_col := (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_lines' AND COLUMN_NAME = 'plant_id'
);
SET @alter_lines_plant := IF(@has_plant_col = 0, 
    'ALTER TABLE production_lines ADD COLUMN plant_id INT NULL AFTER factory_id, ADD COLUMN line_code VARCHAR(50) NULL AFTER name, ADD COLUMN production_capacity INT NOT NULL DEFAULT 450 AFTER status', 
    'SELECT 1'
);
PREPARE stmt FROM @alter_lines_plant;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. VEHICLE MODELS (Products being manufactured)
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

-- 4. WORK ORDERS
CREATE TABLE IF NOT EXISTS work_orders (
    work_order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NOT NULL,
    line_id INT NOT NULL,
    model_id INT NOT NULL,
    work_order_number VARCHAR(50) NOT NULL UNIQUE,
    planned_quantity INT NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
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

-- 5. EQUIPMENT
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

-- 6. DEFECT CATEGORIES
CREATE TABLE IF NOT EXISTS defect_categories (
    defect_category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    severity_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Add additive columns to production_records
SET @has_rec_wo := (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'work_order_id'
);
SET @alter_rec_wo := IF(@has_rec_wo = 0, 
    'ALTER TABLE production_records ADD COLUMN work_order_id BIGINT NULL AFTER line_id, ADD COLUMN good_quantity INT NOT NULL DEFAULT 0 AFTER produced_quantity, ADD COLUMN defective_quantity INT NOT NULL DEFAULT 0 AFTER good_quantity', 
    'SELECT 1'
);
PREPARE stmt FROM @alter_rec_wo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. DOWNTIME RECORDS
CREATE TABLE IF NOT EXISTS downtime_records (
    downtime_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    production_id INT NULL,
    downtime_start DATETIME NOT NULL,
    downtime_end DATETIME NULL,
    duration_minutes INT NOT NULL DEFAULT 0,
    downtime_reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dt_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dt_production FOREIGN KEY (production_id) REFERENCES production_records(record_id) ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_dt_equipment (equipment_id),
    INDEX idx_dt_production (production_id),
    INDEX idx_dt_start (downtime_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. QUALITY INSPECTIONS
CREATE TABLE IF NOT EXISTS quality_inspections (
    inspection_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    production_id INT NOT NULL,
    inspected_quantity INT NOT NULL DEFAULT 0,
    accepted_quantity INT NOT NULL DEFAULT 0,
    rejected_quantity INT NOT NULL DEFAULT 0,
    inspection_status ENUM('ACCEPTED', 'REJECTED', 'PENDING') NOT NULL DEFAULT 'ACCEPTED',
    inspector_id INT NULL,
    inspection_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_qi_production FOREIGN KEY (production_id) REFERENCES production_records(record_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_qi_prod (production_id),
    INDEX idx_qi_status (inspection_status),
    INDEX idx_qi_date (inspection_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Add additive columns to quality_issues
SET @has_qi_cat_id := (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quality_issues' AND COLUMN_NAME = 'defect_category_id'
);
SET @alter_qi_cat_id := IF(@has_qi_cat_id = 0, 
    'ALTER TABLE quality_issues ADD COLUMN defect_category_id INT NULL AFTER record_id, ADD COLUMN assigned_to INT NULL AFTER defect_category_id, ADD COLUMN reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER description, ADD COLUMN resolved_at TIMESTAMP NULL AFTER reported_at', 
    'SELECT 1'
);
PREPARE stmt FROM @alter_qi_cat_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 11. Add additive columns to users (plant_id, role_id)
SET @has_user_plant := (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'plant_id'
);
SET @alter_user_plant := IF(@has_user_plant = 0, 
    'ALTER TABLE users ADD COLUMN plant_id INT NULL AFTER user_id, ADD COLUMN role_id INT NULL AFTER password_hash', 
    'SELECT 1'
);
PREPARE stmt FROM @alter_user_plant;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
