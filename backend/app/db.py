import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Read DB config with defaults (important fix)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "corporate_db")


def get_connection(username: str, password: str):
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=username,
            password=password
        )
        return conn

    except Exception as e:
        print(f"[DB CONNECTION ERROR] {e}")
        raise


def set_vpd_context(conn, context: dict):
    cur = None
    try:
        cur = conn.cursor()

        # Set session variables for RLS
        cur.execute("SET app.username = %s;", (context.get("username"),))
        cur.execute("SET app.role = %s;", (context.get("role"),))
        cur.execute("SET app.department = %s;", (context.get("department"),))
        cur.execute("SET app.location = %s;", (context.get("location"),))

        conn.commit()

    except Exception as e:
        print(f"[VPD CONTEXT ERROR] {e}")
        conn.rollback()
        raise

    finally:
        if cur:
            cur.close()