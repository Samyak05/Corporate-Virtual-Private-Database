import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")


def get_connection(username: str, password: str):
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=username,
        password=password
    )
    return conn


def set_vpd_context(conn, context: dict):
    cur = conn.cursor()

    cur.execute("SET app.username = %s;", (context["username"],))
    cur.execute("SET app.role = %s;", (context["role"],))
    cur.execute("SET app.department = %s;", (context["department"],))
    cur.execute("SET app.location = %s;", (context["location"],))

    conn.commit()
    cur.close()