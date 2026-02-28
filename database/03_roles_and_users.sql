-- =====================================================
-- Insert Roles
-- =====================================================

INSERT INTO roles (role_name, description) VALUES
('Admin', 'System administrator with full access'),
('Manager', 'Department-level manager'),
('HR', 'Human resources staff'),
('Employee', 'Regular employee'),
('Auditor', 'Read-only auditor');

-- =====================================================
-- Insert Users
-- =====================================================

INSERT INTO users (username, password_hash, role, department, location) VALUES
('admin1', 'hash_admin', 'Admin', 'IT', 'Internal'),
('manager1', 'hash_manager', 'Manager', 'Sales', 'Internal'),
('hr1', 'hash_hr', 'HR', 'HR', 'Internal'),
('emp1', 'hash_emp', 'Employee', 'Sales', 'Internal'),
('auditor1', 'hash_audit', 'Auditor', 'Audit', 'Internal');