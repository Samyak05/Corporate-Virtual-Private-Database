-- =====================================================
-- Create Application DB Roles (Non-Superusers)
-- =====================================================

CREATE ROLE app_admin LOGIN PASSWORD 'adminpass';
CREATE ROLE app_manager LOGIN PASSWORD 'managerpass';
CREATE ROLE app_hr LOGIN PASSWORD 'hrpass';
CREATE ROLE app_employee LOGIN PASSWORD 'emppass';
CREATE ROLE app_auditor LOGIN PASSWORD 'auditpass';

-- Database access
GRANT CONNECT ON DATABASE corporate_db TO
app_admin, app_manager, app_hr, app_employee, app_auditor;

-- Schema access
GRANT USAGE ON SCHEMA public TO
app_admin, app_manager, app_hr, app_employee, app_auditor;

-- Table access (IMPORTANT: Keep SELECT so RLS works)
GRANT SELECT ON employees TO
app_admin, app_manager, app_hr, app_employee;

GRANT INSERT, UPDATE ON employees TO
app_admin, app_manager, app_hr;

GRANT SELECT ON audit_logs TO app_auditor;