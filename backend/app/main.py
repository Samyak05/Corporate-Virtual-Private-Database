from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db import get_connection, set_vpd_context
from app.auth import create_token, decode_token
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ===============================
# MODELS
# ===============================

class LoginRequest(BaseModel):
    username: str
    password: str


class EmployeeCreate(BaseModel):
    emp_id: int
    emp_name: str
    age: int
    gender: str
    department: str
    job_title: str
    experience_years: int
    education_level: str
    location: str
    salary: int
    username: str


class EmployeeUpdate(BaseModel):
    emp_name: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[int] = None

# ===============================
# DB PASSWORDS
# ===============================

db_passwords = {
    "app_hr": "hrpass",
    "app_manager": "managerpass",
    "app_employee": "emppass",
    "app_auditor": "auditpass"
}


# ===============================
# USERS
# ===============================

users = {
    "hr1": {"password": "hrpass", "db_user": "app_hr", "role": "HR", "department": "HR"},
    "manager1": {"password": "managerpass", "db_user": "app_manager", "role": "Manager", "department": "Sales"},
    "emp1": {"password": "emppass", "db_user": "app_employee", "role": "Employee", "department": "Engineering"},
    "auditor1": {"password": "auditpass", "db_user": "app_auditor", "role": "Auditor", "department": None}
}


# ===============================
# AUTH
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

    return {
        "access_token": token,
        "token_type": "bearer",
        "token": token
    }


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    payload = decode_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload


# ===============================
# HELPER
# ===============================

def get_db_conn(user):
    conn = get_connection(user["db_user"], db_passwords[user["db_user"]])

    context = {
        "username": user["username"],
        "role": user["role"],
        "department": user["department"],
        "location": "Internal"
    }

    set_vpd_context(conn, context)
    return conn


# ===============================
# READ
# ===============================
@app.get("/employees")
def get_employees(limit: int = 50, offset: int = 0, user=Depends(get_current_user)):

    conn = get_db_conn(user)
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            emp_id,
            emp_name,
            department,
            job_title,
            experience_years,
            education_level,
            location,
            gender,
            salary,
            is_active
        FROM employees
        ORDER BY emp_id DESC
        LIMIT %s OFFSET %s;
    """, (limit, offset))

    rows = cur.fetchall()

    columns = [desc[0] for desc in cur.description]
    data = [dict(zip(columns, row)) for row in rows]

    cur.close()
    conn.close()

    return data

# ===============================
# SEARCH BY ID
# ===============================

@app.get("/employees/{emp_id}")
def get_employee_by_id(emp_id: int, user=Depends(get_current_user)):
    conn = get_db_conn(user)
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            emp_id,
            emp_name,
            department,
            job_title,
            experience_years,
            education_level,
            location,
            gender,
            salary
        FROM employees
        WHERE emp_id = %s;
    """, (emp_id,))

    row = cur.fetchone()

    cur.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Employee not found or access denied")

    columns = [
        "emp_id",
        "emp_name",
        "department",
        "job_title",
        "experience_years",
        "education_level",
        "location",
        "gender",
        "salary"
    ]

    return dict(zip(columns, row))


# ===============================
# CREATE (HR ONLY)
# ===============================

@app.post("/employees")
def create_employee(emp: EmployeeCreate, user=Depends(get_current_user)):

    if user["role"] != "HR":
        raise HTTPException(status_code=403, detail="Only HR can create employees")

    conn = get_db_conn(user)
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO employees (
            emp_id, emp_name, age, gender, department, job_title,
            experience_years, education_level, location, salary,
            username, role
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'Employee')
    """, (
        emp.emp_id, emp.emp_name, emp.age, emp.gender,
        emp.department, emp.job_title,
        emp.experience_years, emp.education_level,
        emp.location, emp.salary, emp.username
    ))

    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Employee created successfully"}


# ===============================
# UPDATE (HR + MANAGER)
# ===============================

@app.put("/employees/{emp_id}")
def update_employee(emp_id: int, emp: EmployeeUpdate, user=Depends(get_current_user)):

    if user["role"] not in ["HR", "Manager"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    conn = get_db_conn(user)
    cur = conn.cursor()

    updates = []
    values = []

    if emp.emp_name:
        updates.append("emp_name = %s")
        values.append(emp.emp_name)

    if emp.department:
        updates.append("department = %s")
        values.append(emp.department)

    if emp.job_title:
        updates.append("job_title = %s")
        values.append(emp.job_title)

    if emp.location:
        updates.append("location = %s")
        values.append(emp.location)

    if emp.salary:
        updates.append("salary = %s")
        values.append(emp.salary)

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    query = f"""
        UPDATE employees
        SET {', '.join(updates)}
        WHERE emp_id = %s
    """

    values.append(emp_id)

    cur.execute(query, values)

    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Employee updated successfully"}


# ===============================
# SOFT DELETE (HR ONLY)
# ===============================

@app.patch("/employees/{emp_id}/inactive")
def deactivate_employee(emp_id: int, user=Depends(get_current_user)):

    if user["role"] != "HR":
        raise HTTPException(status_code=403, detail="Only HR can deactivate employees")

    conn = get_db_conn(user)
    cur = conn.cursor()

    cur.execute("""
        UPDATE employees
        SET is_active = FALSE
        WHERE emp_id = %s
    """, (emp_id,))

    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Employee marked as inactive"}


# ===============================
# AUDIT LOGS
# ===============================

@app.get("/audit-logs")
def get_audit_logs(user=Depends(get_current_user)):

    if user["role"] != "Auditor":
        raise HTTPException(status_code=403, detail="Access denied")

    conn = get_connection(user["db_user"], db_passwords[user["db_user"]])
    cur = conn.cursor()

    cur.execute("""
        SELECT audit_id, user_id, action, table_name, result, access_time
        FROM audit_logs
        ORDER BY audit_id;
    """)

    columns = [desc[0] for desc in cur.description]
    logs = [dict(zip(columns, row)) for row in cur.fetchall()]

    cur.close()
    conn.close()

    return logs

@app.get("/employees/count")
def get_employee_count(user=Depends(get_current_user)):

    # Only HR & Manager allowed
    if user["role"] not in ["HR", "Manager"]:
        raise HTTPException(status_code=403, detail="Access denied")

    conn = get_connection(user["db_user"], db_passwords[user["db_user"]])
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM employees WHERE is_active = TRUE;")
    count = cur.fetchone()[0]

    cur.close()
    conn.close()

    return {"total": count}