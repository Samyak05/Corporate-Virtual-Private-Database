-- Enable Row Level Security (VPD Equivalent)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;



-- Create Row Level Security Policies

-- HR Policy
CREATE  POLICY hr_policy
ON employees
FOR SELECT
USING (
    current_setting('app.role', true) = 'HR'
    AND department = current_setting('app.department', true)
);

--HR can UPDATE only when Internal
--If External → blocked by RLS
CREATE POLICY hr_update_policy
ON employees
FOR UPDATE
USING (
    current_setting('app.role', true) = 'HR'
    AND department = current_setting('app.department', true)
    AND current_setting('app.location', true) = 'Internal'
);


-- Manager Policy
CREATE POLICY manager_policy
ON employees
FOR SELECT
USING (
    current_setting('app.role', true) = 'Manager'
    AND department = current_setting('app.department', true)
);

CREATE POLICY manager_update_policy
ON employees
FOR UPDATE
USING (
    current_setting('app.role', true) = 'Manager'
    AND department = current_setting('app.department', true)
    AND current_setting('app.location', true) = 'Internal'
);



-- Employee Policy
CREATE POLICY employee_policy
ON employees
FOR SELECT
USING (
    current_setting('app.role', true) = 'Employee'
    AND emp_name = current_setting('app.username', true)
);



-- Admin Policy
CREATE POLICY admin_policy
ON employees
FOR SELECT
USING (
    current_setting('app.role', true) = 'Admin'
);
-- Admin DELETE Policy
CREATE POLICY admin_delete_policy
ON employees
FOR DELETE
USING (
    current_setting('app.role', true) = 'Admin'
);