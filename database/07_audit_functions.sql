-- =====================================================
-- Function: Log INSERT / UPDATE / DELETE
-- =====================================================

CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO audit_logs(user_id, action, table_name, result)
    VALUES (
        (SELECT user_id 
         FROM users
         WHERE username = current_setting('app.username', true)),
        TG_OP,
        'employees',
        'SUCCESS'
    );

    RETURN NEW;

EXCEPTION
    WHEN others THEN
        INSERT INTO audit_logs(user_id, action, table_name, result)
        VALUES (
            (SELECT user_id 
             FROM users
             WHERE username = current_setting('app.username', true)),
            TG_OP,
            'employees',
            'FAILURE'
        );
        RAISE;
END;
$$;

ALTER FUNCTION log_employee_changes() OWNER TO postgres;
ALTER FUNCTION log_employee_changes() SET search_path = public;



-- =====================================================
-- Function: Log SELECT
-- =====================================================

CREATE OR REPLACE FUNCTION log_employee_select()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO audit_logs(user_id, action, table_name, result)
    VALUES (
        (SELECT user_id 
         FROM users
         WHERE username = current_setting('app.username', true)),
        'SELECT',
        'employees',
        'SUCCESS'
    );
END;
$$;

ALTER FUNCTION log_employee_select() OWNER TO postgres;
ALTER FUNCTION log_employee_select() SET search_path = public;