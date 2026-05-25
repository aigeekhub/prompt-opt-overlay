import os
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load env variables
load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "127.0.0.1"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        database=os.getenv("POSTGRES_DB", "claw_ops"),
        user=os.getenv("POSTGRES_USER", "mobu"),
        password=os.getenv("POSTGRES_PASSWORD", "")
    )

def hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode('utf-8')).hexdigest()

def is_user_allowed(user_id: int) -> bool:
    # 1. Check environment variable allowlist
    env_allowlist = os.getenv("TELEGRAM_ALLOWLIST_USER_IDS", "")
    if env_allowlist:
        try:
            allowed_ids = [int(x.strip()) for x in env_allowlist.split(",") if x.strip()]
            if user_id in allowed_ids:
                return True
        except Exception as e:
            print(f"Error parsing TELEGRAM_ALLOWLIST_USER_IDS: {e}")

    # 2. Check PostgreSQL database table `telegram_users`
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM telegram_users WHERE telegram_user_id = %s", (user_id,))
                row = cur.fetchone()
                if row:
                    return True
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error in is_user_allowed: {e}")

    return False

def is_user_admin(user_id: int) -> bool:
    # 1. Check environment variable admins
    env_admins = os.getenv("TELEGRAM_ADMIN_USER_IDS", "")
    if env_admins:
        try:
            admin_ids = [int(x.strip()) for x in env_admins.split(",") if x.strip()]
            if user_id in admin_ids:
                return True
        except Exception as e:
            print(f"Error parsing TELEGRAM_ADMIN_USER_IDS: {e}")

    # 2. Check PostgreSQL database table `telegram_users` for is_admin flag
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT is_admin FROM telegram_users WHERE telegram_user_id = %s", (user_id,))
                row = cur.fetchone()
                if row and row["is_admin"]:
                    return True
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error in is_user_admin: {e}")

    return False

def verify_admin_pin(user_id: int, pin: str) -> bool:
    # 1. Check environment variable fallback
    env_pin = os.getenv("TELEGRAM_ADMIN_PIN", "")
    if env_pin and pin == env_pin:
        return True

    # 2. Check PostgreSQL database table `telegram_users`
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT pin_hash FROM telegram_users WHERE telegram_user_id = %s", (user_id,))
                row = cur.fetchone()
                if row and row["pin_hash"]:
                    hashed_input = hash_pin(pin)
                    if hashed_input == row["pin_hash"]:
                        return True
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error in verify_admin_pin: {e}")

    return False

def get_tenant_id(user_id: int) -> str:
    # Check PostgreSQL database table `telegram_users`
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT tenant_id FROM telegram_users WHERE telegram_user_id = %s", (user_id,))
                row = cur.fetchone()
                if row and row["tenant_id"]:
                    return str(row["tenant_id"])
        finally:
            conn.close()
    except Exception as e:
        print(f"Database error in get_tenant_id: {e}")

    # Default tenant ID seeded in init.sql
    return '00000000-0000-0000-0000-000000000000'
