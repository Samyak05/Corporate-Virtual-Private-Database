-- ====================================================================================
-- 7. Create Application DB Roles (Non-Superusers), Set Passwords, and Grant Privileges
-- ====================================================================================

-- app_admin
CREATE ROLE app_admin LOGIN PASSWORD 'adminpass';
GRANT CONNECT ON DATABASE corporate_db TO app_admin;
GRANT USAGE ON SCHEMA public TO app_admin;
GRANT SELECT, INSERT, UPDATE ON employees TO app_admin;

-- app_manager
CREATE ROLE app_manager LOGIN PASSWORD 'managerpass';
GRANT CONNECT ON DATABASE corporate_db TO app_manager;
GRANT USAGE ON SCHEMA public TO app_manager;
GRANT SELECT, INSERT, UPDATE ON employees TO app_manager;

-- app_hr
CREATE ROLE app_hr LOGIN PASSWORD 'hrpass';
GRANT CONNECT ON DATABASE corporate_db TO app_hr;
GRANT USAGE ON SCHEMA public TO app_hr;
GRANT SELECT, INSERT, UPDATE ON employees TO app_hr;

-- app_employee
CREATE ROLE app_employee LOGIN PASSWORD 'emppass';
GRANT CONNECT ON DATABASE corporate_db TO app_employee;
GRANT USAGE ON SCHEMA public TO app_employee;
GRANT SELECT ON employees TO app_employee;

-- app_auditor
CREATE ROLE app_auditor LOGIN PASSWORD 'auditpass';
GRANT CONNECT ON DATABASE corporate_db TO app_auditor;
GRANT USAGE ON SCHEMA public TO app_auditor;
GRANT SELECT ON audit_logs TO app_auditor;