# ⚙️ Backend (FastAPI)

This backend provides APIs for authentication, employee data access, and audit logs.

---

## 🚀 Setup

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

---

## 🔐 Environment Variables

Create `.env`:

```bash
cp .env.example .env
```

Fill values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=corporate_db
SECRET_KEY=supersecretkey
ALGORITHM=HS256
```

---

## ▶️ Run Server

```bash
uvicorn app.main:app --reload
```

---

## 📡 API Docs

Open:

```bash
http://127.0.0.1:8000/docs
```

---

## 🔑 APIs

* `POST /login`
* `GET /employees`
* `PUT /employees/update-salary`
* `GET /audit-logs`

---
