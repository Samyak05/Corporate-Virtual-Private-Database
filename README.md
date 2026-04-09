# 🔐 Corporate Secure Database System (RBAC + RLS)

A full-stack system demonstrating **Role-Based Access Control (RBAC)** and **Row-Level Security (RLS)** using PostgreSQL, FastAPI, and a custom frontend.

---

# 🚀 Features

* Role-Based Access Control (RBAC)
* Row-Level Security (RLS / VPD simulation)
* JWT Authentication
* Department-based data isolation
* Location-based access control
* Audit logging (triggers)
* Full-stack integration (Frontend + Backend + DB)

---

# 🏗️ Tech Stack

* PostgreSQL
* FastAPI (Python)
* HTML, CSS, JavaScript
* JWT (python-jose)

---

# 📂 Project Structure

```
corporate-vpd-system/
│
├── database/
├── backend/
├── frontend/
├── docs/
└── README.md
```

---

# ⚙️ Complete Setup (Fresh System)

Follow these steps **exactly**.

---

## 🔹 1. Clone Repository

```
git clone https://github.com/Samyak05/corporate-secure-database-rbac-rls.git
cd corporate-secure-database-rbac-rls
```

---

## 🔹 2. Install PostgreSQL

```
sudo apt update
sudo apt install postgresql postgresql-contrib
```

---

## 🔹 3. Setup Database

```
sudo -i -u postgres
psql
```

Inside psql:

```
\i database/setup.sql
```

---

## 🔹 4. Setup Backend

```
cd backend

# create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# install dependencies
pip install -r requirements.txt
```

Create environment file:

```
cp .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=corporate_db
SECRET_KEY=supersecretkey
ALGORITHM=HS256
```

Run backend:

```
uvicorn app.main:app --reload
```

---

## 🔹 5. Run Frontend

```
cd frontend/src
```

Open:

```
index.html
```

---

# 🧪 Test the System

Open browser:

```
http://127.0.0.1:8000/docs
```

Try:

* `/login`
* `/employees`
* `/employees/update-salary`

---

# 🔐 Demo Users

| Role     | Username | Password    |
| -------- | -------- | ----------- |
| HR       | hr1      | hrpass      |
| Manager  | manager1 | managerpass |
| Employee | Alice    | emppass     |
| Auditor  | auditor1 | auditpass   |

---

# 🎯 What This Project Shows

* Database-level security enforcement (RLS)
* Context-aware access control
* Separation of duties (Auditor role)
* Secure backend integration
* Real-world full-stack architecture

---

# ⚠️ Notes

* This is an academic/demo project
* Do not use hardcoded credentials in production

---

# 👨‍💻 Author

Samyak Gedam

---
