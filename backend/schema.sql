CREATE DATABASE IF NOT EXISTS access_portal;
USE access_portal;

CREATE TABLE IF NOT EXISTS systems (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    asgardeo_group_id VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS access_requests (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(255) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    system_id VARCHAR(50) NOT NULL,
    system_name VARCHAR(100) NOT NULL,
    asgardeo_group_id VARCHAR(255) NOT NULL DEFAULT '',
    justification TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    requested_at VARCHAR(30) NOT NULL,
    reviewed_by VARCHAR(255),
    reviewed_at VARCHAR(30),
    review_comment TEXT,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_system (system_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    performed_by_email VARCHAR(255) NOT NULL DEFAULT '',
    target_id VARCHAR(36),
    details TEXT,
    created_at VARCHAR(30) NOT NULL,
    INDEX idx_created (created_at)
);

INSERT IGNORE INTO systems (id, name, description, category, asgardeo_group_id, created_at) VALUES
('dev-tools', 'Developer Tools', 'GitHub, Jira, CI/CD pipelines and code review tools', 'Engineering', 'PLACEHOLDER_GROUP_DEV', '2026-01-01T00:00:00Z'),
('hr-system', 'HR System', 'Employee records, payroll data and leave management', 'Human Resources', 'PLACEHOLDER_GROUP_HR', '2026-01-01T00:00:00Z'),
('finance', 'Finance System', 'Financial reports, budgets and expense tracking', 'Finance', 'PLACEHOLDER_GROUP_FINANCE', '2026-01-01T00:00:00Z'),
('crm', 'CRM Platform', 'Customer records, sales pipeline and client interactions', 'Sales', 'PLACEHOLDER_GROUP_CRM', '2026-01-01T00:00:00Z'),
('analytics', 'Analytics Dashboard', 'Business intelligence, reporting and data visualisation', 'Data', 'PLACEHOLDER_GROUP_ANALYTICS', '2026-01-01T00:00:00Z'),
('infra', 'Cloud Infrastructure', 'AWS/Azure console, Kubernetes and deployment access', 'Engineering', 'PLACEHOLDER_GROUP_INFRA', '2026-01-01T00:00:00Z');
