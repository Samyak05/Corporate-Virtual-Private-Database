-- =====================================================
-- Reset Employees Table
-- =====================================================

TRUNCATE TABLE employees RESTART IDENTITY CASCADE;

-- ===============================
-- STEP 1: LOAD CSV DATA
-- ===============================

\copy employees(
    emp_id,
    emp_name,
    age,
    gender,
    department,
    job_title,
    experience_years,
    education_level,
    location,
    salary
)
FROM 'Employers_data.csv'
DELIMITER ','
CSV HEADER;


-- ===============================
-- STEP 2: DEFAULT SECURITY VALUES
-- ===============================

UPDATE employees
SET role = 'Employee';

UPDATE employees
SET username = emp_name;


-- ===============================
-- STEP 3: ASSIGN HR USERS
-- ===============================

UPDATE employees
SET username = 'hr1',
    role = 'HR'
WHERE department = 'HR';


-- ===============================
-- STEP 4: ASSIGN MANAGER USERS
-- ===============================

UPDATE employees
SET username = 'manager1',
    role = 'Manager'
WHERE department = 'Sales';


-- ===============================
-- STEP 5: VERIFY DATA
-- ===============================

SELECT emp_name, department, username, role
FROM employees
LIMIT 10;