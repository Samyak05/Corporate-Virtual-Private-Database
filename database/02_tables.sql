CREATE TABLE roles (
    role_name VARCHAR(20) PRIMARY KEY,
    description TEXT
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) REFERENCES roles(role_name),
    department VARCHAR(50),
    location VARCHAR(20)
);

CREATE TABLE employees (
    emp_id INT PRIMARY KEY,
    emp_name TEXT,
    age INT,
    gender TEXT,
    department TEXT,
    job_title TEXT,
    experience_years INT,
    education_level TEXT,
    location TEXT,
    salary INT,

    -- SECURITY FIELDS
    username TEXT,
    role TEXT,

    -- NEW FIELD: SOFT DELETE SUPPORT
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE audit_logs (
    audit_id SERIAL PRIMARY KEY,
    user_id INT,
    action VARCHAR(20),
    table_name VARCHAR(50),
    access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result VARCHAR(20)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(access_time);

--  OPTIONAL: Performance index for active employees
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);