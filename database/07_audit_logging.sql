-- =====================================
-- Audit Logging for Employees Table
-- =====================================

CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs(user_id, action, table_name, result)
    VALUES (
        (SELECT user_id FROM users 
         WHERE username = current_setting('app.username', true)),
        TG_OP,
        'employees',
        'SUCCESS'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



DROP TRIGGER IF EXISTS employee_audit_trigger ON employees;

CREATE TRIGGER employee_audit_trigger
AFTER INSERT OR UPDATE OR DELETE
ON employees
FOR EACH ROW
EXECUTE FUNCTION log_employee_changes();
