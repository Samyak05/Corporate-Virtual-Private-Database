from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db import get_connection, set_vpd_context
from app.auth import create_token, decode_token
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

class LoginRequest(BaseModel):
    username: str
    password: str

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow frontend
    allow_credentials=True,
    allow_methods=["*"],   # allow POST, OPTIONS, etc.
    allow_headers=["*"],
)

security = HTTPBearer()

# 🔐 DB Password Mapping (centralized)
db_passwords = {
    "app_hr": "hrpass",
    "app_manager": "managerpass",
    "app_employee": "emppass",
    "app_auditor": "auditpass"
}

# 🔐 Mock users (login system)
users = {
    "hr1": {"password": "hrpass", "db_user": "app_hr", "role": "HR", "department": "HR"},
    "manager1": {"password": "managerpass", "db_user": "app_manager", "role": "Manager", "department": "Sales"},
    "Alice": {"password": "emppass", "db_user": "app_employee", "role": "Employee", "department": "Sales"},
    "auditor1": {"password": "auditpass", "db_user": "app_auditor", "role": "Auditor", "department": None}
}

# ===============================
# 🔐 AUTH APIs
# ===============================

@app.post("/login")
def login(request: LoginRequest):
    user = users.get(request.username)

    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({
        "username": request.username,
        "db_user": user["db_user"],
        "role": user["role"],
        "department": user["department"]
    })

    return {"access_token": token}


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload


# ===============================
# 🔹 HELPER FUNCTION
# ===============================

def execute_query(user, query, params=None):
    try:
        conn = get_connection(user["db_user"], db_passwords[user["db_user"]])

        context = {
            "username": user["username"],
            "role": user["role"],
            "department": user["department"],
            "location": "Internal"
        }

        set_vpd_context(conn, context)

        cur = conn.cursor()
        cur.execute(query, params or ())

        columns = [desc[0] for desc in cur.description]
        data = [dict(zip(columns, row)) for row in cur.fetchall()]

        cur.close()
        conn.close()

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===============================
# 📊 EMPLOYEE DATA API
# ===============================

@app.get("/employees")
def get_employees(user=Depends(get_current_user)):
    query = """
        SELECT emp_id, emp_name, department, job_title, location, salary
        FROM employees
        ORDER BY emp_id;
    """
    print("USER CONTEXT:", user)
    return execute_query(user, query)


# ===============================
# ✏️ UPDATE API (RLS CONTROLLED)
# ===============================

@app.put("/employees/update-salary")
def update_salary(user=Depends(get_current_user)):

    try:
        conn = get_connection(user["db_user"], db_passwords[user["db_user"]])

        context = {
            "username": user["username"],
            "role": user["role"],
            "department": user["department"],
            "location": "Internal"
        }

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


# ===============================
# 📜 AUDIT LOGS (AUDITOR ONLY)
# ===============================

@app.get("/audit-logs")
def get_audit_logs(user=Depends(get_current_user)):

    if user["role"] != "Auditor":
        raise HTTPException(status_code=403, detail="Access denied")

    try:
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

        columns = [desc[0] for desc in cur.description]
        logs = [dict(zip(columns, row)) for row in cur.fetchall()]

        cur.close()
        conn.close()

        return logs

    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))