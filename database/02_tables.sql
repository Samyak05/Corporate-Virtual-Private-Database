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
    emp_id SERIAL PRIMARY KEY,
    emp_name VARCHAR(50),
    department VARCHAR(50),
    salary NUMERIC,
    created_by VARCHAR(50),
    sensitivity_level INT
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
