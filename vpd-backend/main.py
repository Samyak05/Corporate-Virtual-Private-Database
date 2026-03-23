from fastapi import FastAPI
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