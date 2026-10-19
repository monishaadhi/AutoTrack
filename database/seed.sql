-- AutoTrack: Seed Data Script
-- Fictional Automotive Manufacturing Data
-- Safe to rerun: uses INSERT ... ON DUPLICATE KEY UPDATE without deleting existing records

USE autotrack;

-- 1. FACTORIES (3 Fictional Facilities)
INSERT INTO factories (factory_id, name, location) VALUES
(1, 'Apex Assembly Complex', 'Detroit, Michigan, USA'),
(2, 'Solaria Electric Gigafactory', 'Fremont, California, USA'),
(3, 'Keystone Powertrain & Stamping Plant', 'Louisville, Kentucky, USA')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    location = VALUES(location);

-- 2. PRODUCTION LINES (6 Lines distributed across the 3 factories)
INSERT INTO production_lines (line_id, factory_id, name, status) VALUES
(1, 1, 'Body Framing & Stamping Line A', 'RUNNING'),
(2, 1, 'Final Assembly & Trim Line B', 'RUNNING'),
(3, 2, 'EV Battery Pack & Drive Unit Line 1', 'RUNNING'),
(4, 2, 'Automated Robotic Paint Shop 2', 'MAINTENANCE'),
(5, 3, 'Chassis & Subframe Welding Cell', 'IDLE'),
(6, 3, 'End-of-Line Dyno & Safety Inspection', 'STOPPED')
ON DUPLICATE KEY UPDATE
    factory_id = VALUES(factory_id),
    name = VALUES(name),
    status = VALUES(status);

-- 3. PRODUCTION RECORDS (Multi-Day Shift Records across Morning, Evening, Night)
INSERT INTO production_records (
    record_id, line_id, production_date, shift, target_quantity, produced_quantity, defect_count, downtime_minutes
) VALUES
-- Day 1: 2026-10-15
(1, 1, '2026-10-15', 'Morning', 360, 345, 4, 15),
(2, 1, '2026-10-15', 'Evening', 360, 352, 3, 10),
(3, 2, '2026-10-15', 'Morning', 400, 390, 6, 20),
(4, 2, '2026-10-15', 'Evening', 400, 385, 8, 25),
(5, 3, '2026-10-15', 'Morning', 320, 318, 2, 5),
(6, 4, '2026-10-15', 'Morning', 280, 210, 15, 65),

-- Day 2: 2026-10-16
(7, 1, '2026-10-16', 'Morning', 360, 355, 2, 5),
(8, 1, '2026-10-16', 'Evening', 360, 340, 5, 22),
(9, 2, '2026-10-16', 'Morning', 400, 395, 4, 10),
(10, 3, '2026-10-16', 'Morning', 320, 310, 3, 18),
(11, 3, '2026-10-16', 'Evening', 320, 324, 1, 0),
(12, 5, '2026-10-16', 'Morning', 250, 230, 7, 35),

-- Day 3: 2026-10-17
(13, 1, '2026-10-17', 'Morning', 360, 348, 4, 12),
(14, 2, '2026-10-17', 'Morning', 400, 388, 5, 18),
(15, 2, '2026-10-17', 'Night',   350, 342, 3, 10),
(16, 3, '2026-10-17', 'Morning', 320, 315, 2, 10),
(17, 4, '2026-10-17', 'Morning', 280, 195, 18, 90),
(18, 6, '2026-10-17', 'Morning', 300, 220, 12, 110),

-- Day 4: 2026-10-18 (Current Date)
(19, 1, '2026-10-18', 'Morning', 360, 350, 3, 8),
(20, 2, '2026-10-18', 'Morning', 400, 392, 4, 14),
(21, 3, '2026-10-18', 'Morning', 320, 318, 1, 4),
(22, 4, '2026-10-18', 'Morning', 280, 205, 14, 75),
(23, 5, '2026-10-18', 'Morning', 250, 240, 5, 15),
(24, 6, '2026-10-18', 'Morning', 300, 180, 16, 140)
ON DUPLICATE KEY UPDATE
    target_quantity = VALUES(target_quantity),
    produced_quantity = VALUES(produced_quantity),
    defect_count = VALUES(defect_count),
    downtime_minutes = VALUES(downtime_minutes);

-- 4. QUALITY ISSUES (Fictional Defects Linked to Production Records)
INSERT INTO quality_issues (
    issue_id, record_id, category, severity, status, description
) VALUES
(1, 6, 'Paint', 'High', 'OPEN', 'Clearcoat micro-bubble blistering detected on passenger door panels during visual audit.'),
(2, 4, 'Torque', 'Critical', 'IN_REVIEW', 'Pinch bolt torque deviation on right steering knuckle (measured 79 Nm, specification 95 Nm).'),
(3, 1, 'Weld', 'Low', 'RESOLVED', 'Spot weld penetration depth slightly below standard on B-pillar reinforcement bracket. Corrected.'),
(4, 17, 'Paint', 'Critical', 'OPEN', 'Primer thickness unevenness exceeding 25 microns on tailgate contour section.'),
(5, 12, 'Alignment', 'Medium', 'IN_REVIEW', 'Rear subframe crossmember mounting hole offset by 1.8mm against datum pins.'),
(6, 18, 'Electronics', 'High', 'OPEN', 'Radar sensor calibration timeout on dyno testing station during autonomous braking validation.'),
(7, 20, 'Trim', 'Low', 'RESOLVED', 'Interior weatherstripping retaining clip misaligned on driver-side window frame.'),
(8, 22, 'Paint', 'Medium', 'OPEN', 'Orange peel texture anomaly on vehicle roof panel under inspection lighting.'),
(9, 24, 'Electronics', 'Critical', 'OPEN', 'High-voltage interlock loop (HVIL) impedance mismatch detected on chassis roll tester.')
ON DUPLICATE KEY UPDATE
    record_id = VALUES(record_id),
    category = VALUES(category),
    severity = VALUES(severity),
    status = VALUES(status),
    description = VALUES(description);
