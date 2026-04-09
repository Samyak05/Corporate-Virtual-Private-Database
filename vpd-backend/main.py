from fastapi import FastAPI
from fastapi import HTTPException
from db import get_connection, set_vpd_context
from auth import create_token
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth import decode_token

app = FastAPI()
security = HTTPBearer()


# Mock user mapping (we'll improve later)
users = {
    "hr1": {"password": "hrpass", "db_user": "app_hr", "role": "HR", "department": "HR"},
    "manager1": {"password": "managerpass", "db_user": "app_manager", "role": "Manager", "department": "Sales"},
    "Alice": {"password": "emppass", "db_user": "app_employee", "role": "Employee", "department": "Sales"},
    "auditor1": {"password": "auditpass", "db_user": "app_auditor", "role": "Auditor", "department": None}
}

@app.post("/login")
def login(username: str, password: str):

    user = users.get(username)

    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({
        "username": username,
        "db_user": user["db_user"],
        "role": user["role"],
        "department": user["department"]
    })

    return {"access_token": token}


security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload


@app.get("/employees")
def get_employees(user=Depends(get_current_user)):
    try:
        db_passwords = {
            "app_hr": "hrpass",
            "app_manager": "managerpass",
            "app_employee": "emppass",
            "app_auditor": "auditpass"
        }

        print("USER:", user)

        context = {
            "username": user["username"],
            "role": user["role"],
            "department": user["department"],
            "location": "Internal"
        }

        conn = get_connection(user["db_user"], db_passwords[user["db_user"]])
        set_vpd_context(conn, context)

        cur = conn.cursor()
        cur.execute("SELECT emp_id, emp_name, department FROM employees ORDER BY emp_id;")
        
        data = cur.fetchall()

        cur.close()
        conn.close()

        return data

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))



@app.put("/employees/update-salary")
def update_salary(user=Depends(get_current_user)):

    try:
        db_passwords = {
            "app_hr": "hrpass",
            "app_manager": "managerpass",
            "app_employee": "emppass",
            "app_auditor": "auditpass"
        }

        context = {
            "username": user["username"],
            "role": user["role"],
            "department": user["department"],
            "location": "Internal"  # later dynamic
        }

        conn = get_connection(user["db_user"], db_passwords[user["db_user"]])
        set_vpd_context(conn, context)

        cur = conn.cursor()

        cur.execute("""
            UPDATE employees
            SET salary = salary + 500
            WHERE department = %s
        """, (user["department"],))

        rows_updated = cur.rowcount

        conn.commit()

        cur.close()
        conn.close()

        return {"message": f"{rows_updated} rows updated"}

    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))



from fastapi import HTTPException

@app.get("/audit-logs")
def get_audit_logs(user=Depends(get_current_user)):

    try:
        # 🔐 Role check (VERY IMPORTANT)
        if user["role"] != "Auditor":
            raise HTTPException(status_code=403, detail="Access denied")

        db_passwords = {
            "app_hr": "hrpass",
            "app_manager": "managerpass",
            "app_employee": "emppass",
            "app_auditor": "auditpass"
        }

        conn = get_connection(user["db_user"], db_passwords[user["db_user"]])
        cur = conn.cursor()

        cur.execute("""
            SELECT audit_id,
                   user_id,
                   action,
                   table_name,
                   result,
                   access_time
            FROM audit_logs
            ORDER BY audit_id;
        """)

        logs = cur.fetchall()

        cur.close()
        conn.close()

        return logs

    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))