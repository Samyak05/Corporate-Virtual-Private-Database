from fastapi import FastAPI
from fastapi import HTTPException
from db import get_connection, set_vpd_context

app = FastAPI()


@app.get("/employees")
def get_employees(
    db_user: str,
    db_password: str,
    username: str,
    role: str,
    department: str,
    location: str
):
    context = {
        "username": username,
        "role": role,
        "department": department,
        "location": location
    }

    conn = get_connection(db_user, db_password)
    set_vpd_context(conn, context)

    cur = conn.cursor()
    cur.execute("SELECT emp_id, emp_name, department FROM employees ORDER BY emp_id;")
    
    data = cur.fetchall()

    cur.close()
    conn.close()

    return data

@app.put("/employees/update-salary")
def update_salary(
    db_user: str,
    db_password: str,
    username: str,
    role: str,
    department: str,
    location: str
):
    context = {
        "username": username,
        "role": role,
        "department": department,
        "location": location
    }

    try:
        conn = get_connection(db_user, db_password)
        set_vpd_context(conn, context)

        cur = conn.cursor()

        cur.execute("""
            UPDATE employees
            SET salary = salary + 500
            WHERE department = %s
        """, (department,))

        rows_updated = cur.rowcount

        conn.commit()

        cur.close()
        conn.close()

        return {"message": f"{rows_updated} rows updated"}

    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))