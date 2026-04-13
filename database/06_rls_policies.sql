-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;


-- ===============================
-- DROP EXISTING POLICIES (CLEAN)
-- ===============================

DROP POLICY IF EXISTS hr_policy ON employees;
DROP POLICY IF EXISTS hr_update_policy ON employees;

DROP POLICY IF EXISTS manager_policy ON employees;
DROP POLICY IF EXISTS manager_update_policy ON employees;

DROP POLICY IF EXISTS employee_policy ON employees;

DROP POLICY IF EXISTS admin_policy ON employees;
DROP POLICY IF EXISTS admin_delete_policy ON employees;

DROP POLICY IF EXISTS hr_insert_policy ON employees;


-- ===============================
-- HR POLICY (HYBRID)
-- ===============================

CREATE POLICY hr_policy
ON employees
FOR SELECT
USING (
    current_setting('app.role', true) = 'HR'
);

CREATE POLICY hr_update_policy
ON employees
FOR UPDATE
USING (
    current_setting('app.role', true) = 'HR'
    AND department = current_setting('app.department', true)
    AND current_setting('app.location', true) = 'Internal'
)
WITH CHECK (
    current_setting('app.role', true) = 'HR'
    AND current_setting('app.location', true) = 'Internal'
);


-- ===============================
-- MANAGER POLICY
-- ===============================

CREATE POLICY manager_policy
ON employees
FOR SELECT
USING (
    current_setting('app.role', true) = 'Manager'
    AND department = current_setting('app.department', true)
    AND is_active = TRUE
);

CREATE POLICY manager_update_policy
ON employees
FOR UPDATE
USING (
    current_setting('app.role', true) = 'Manager'
    AND department = current_setting('app.department', true)
    AND current_setting('app.location', true) = 'Internal'
)
WITH CHECK (
    current_setting('app.role', true) = 'Manager'
    AND current_setting('app.location', true) = 'Internal'
);


-- ===============================
-- EMPLOYEE POLICY
-- ===============================

CREATE POLICY employee_policy
ON employees
FOR SELECT
USING (
    current_setting('app.role', true) = 'Employee'
    AND username = current_setting('app.username', true)
    AND is_active = TRUE
);


-- ===============================
-- ADMIN POLICY
-- ===============================

CREATE POLICY admin_policy
ON employees
FOR SELECT
USING (
    current_setting('app.role', true) = 'Admin'
    AND is_active = TRUE
);

CREATE POLICY admin_delete_policy
ON employees
FOR DELETE
USING (
    current_setting('app.role', true) = 'Admin'
);


-- ===============================
-- HR INSERT POLICY
-- ===============================

CREATE POLICY hr_insert_policy
ON employees
FOR INSERT
WITH CHECK (
    current_setting('app.role', true) = 'HR'
    AND current_setting('app.location', true) = 'Internal'
);