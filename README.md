# Corporate VPD Project

A PostgreSQL-based implementation of **Virtual Private Database (VPD)** concepts using **Row Level Security (RLS)** to enforce fine-grained, context-aware access control.

This project demonstrates how session-level variables can dynamically control row visibility, simulating Oracle VPD behavior in PostgreSQL.

---

# 📌 Features

- Role-Based Access Control (RBAC)
- PostgreSQL Row Level Security (RLS)
- Session-based row filtering using `current_setting()`
- Department-level data isolation
- Multiple application database roles
- Admin full-access control
- Structured modular SQL setup

---

# 🛠️ Tech Stack

- PostgreSQL
- SQL
- Linux / WSL (Recommended)
- Git & GitHub

---

# 📂 Project Structure

```
corporate-vpd/
│
├── README.md
├── .gitignore
│
├── database/
│   ├── 01_database.sql
│   ├── 02_tables.sql
│   ├── 03_roles_and_users.sql
│   ├── 04_seed_data.sql
│   ├── 05_app_roles.sql
│   ├── 06_rls_policies.sql
│   └── run_order.txt
│
└── docs/
```

---

# 🚀 Complete Setup Guide (Fresh System)

Follow these steps if PostgreSQL is NOT installed.

---

## 1️⃣ Install PostgreSQL (Ubuntu / WSL)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

Verify installation:

```bash
psql --version
```

---

## 2️⃣ Start PostgreSQL Service

```bash
sudo service postgresql start
```

Switch to postgres system user:

```bash
sudo -i -u postgres
```

Open PostgreSQL shell:

```bash
psql
```

---

## 3️⃣ Clone the Repository

```bash
git clone https://github.com/Samyak05/Corporate-Virtual-Private-Database.git
cd Corporate-Virtual-Private-Database/
```

---

## 4️⃣ Execute Database Setup Scripts (Important: Follow Order)

Inside PostgreSQL shell:

```sql
\i 01_database.sql
\i 02_tables.sql
\i 03_roles_and_users.sql
\i 04_seed_data.sql
\i 05_app_roles.sql
\i 06_rls_policies.sql
```

Database setup complete ✅

---

# 🔐 Testing Row-Level Security

Example: Test HR Role Access

Exit postgres user:

```bash
exit
```

Login as app_hr:

```bash
psql -U app_hr -d corporate_db
```

Set session context:

```sql
SET app.username = 'hr1';
SET app.role = 'HR';
SET app.department = 'HR';
SET app.location = 'Internal';
```

Now test access:

```sql
SELECT * FROM employees;
```

Only HR department records should be visible.

---

# 🧠 How It Works

Access control is enforced through:

- PostgreSQL Row Level Security (RLS)
- Custom session variables:
  - `app.username`
  - `app.role`
  - `app.department`
  - `app.location`
- Policies using `current_setting()`

Example policy logic:

```sql
USING (
    current_setting('app.role', true) = 'HR'
    AND department = current_setting('app.department', true)
);
```

This dynamically filters rows based on session context.

---

# 👥 Application Roles

The system includes:

- app_admin
- app_manager
- app_hr
- app_employee
- app_auditor

Each role has specific privileges enforced by both GRANT statements and RLS policies.

---

# ⚠️ Important Notes

- All passwords included are demo credentials for academic purposes only.
- Do NOT use hardcoded passwords in real production systems.
- Row Level Security is enforced using:

```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;
```

---

# 📖 Concepts Demonstrated

- Fine-Grained Access Control
- Virtual Private Database (VPD)
- Session Context Variables
- Dynamic Policy Enforcement
- Multi-role Data Isolation
- Database Security Design

---

# 🎯 Learning Outcome

This project demonstrates how to build secure, context-aware database systems using PostgreSQL without requiring application-layer filtering.

It is suitable for:
- Database security learning
- Academic submission
- Backend system design practice
- Internship portfolio demonstration

---

# 📌 Future Improvements

- Audit logging with triggers
- Backend integration (FastAPI)
- Dockerized PostgreSQL setup
- Environment variable based credential management
- API-level authentication integration
