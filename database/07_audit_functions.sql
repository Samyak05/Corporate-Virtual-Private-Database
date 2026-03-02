-- Function: Log INSERT / UPDATE / DELETE

CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;



-- Function: Log SELECT

CREATE OR REPLACE FUNCTION log_employee_select()
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;