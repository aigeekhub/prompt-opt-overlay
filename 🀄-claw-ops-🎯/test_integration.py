import os
import time
import requests
import psycopg2
from psycopg2.extras import RealDictCursor

# Config
BASE_URL = os.getenv("GATEWAY_URL", "http://127.0.0.1:3000")
TOKEN = "mobu_secret_token_2026_dev"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "127.0.0.1"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        database=os.getenv("POSTGRES_DB", "claw_ops"),
        user=os.getenv("POSTGRES_USER", "mobu"),
        password=os.getenv("POSTGRES_PASSWORD", "MobuSecureDBPassword2026!")
    )

def test_full_job_flow():
    print("\n=== Test 1: Full Job Flow (Queue -> Run -> Complete) ===")
    
    # 1. Submit job
    payload = {
        "message": "Write a 4-line poem about antigravity and coding.",
        "profile": "default_fast"
    }
    r = requests.post(f"{BASE_URL}/v1/chat", json=payload, headers=HEADERS)
    if r.status_code != 201:
        print(f"FAILED: Submit job returned {r.status_code}: {r.text}")
        return False
    
    job_data = r.json()
    job_id = job_data["job_id"]
    print(f"Successfully submitted Job ID: {job_id}")
    
    # 2. Poll DB for completion
    conn = get_db_connection()
    status = "queued"
    max_checks = 15
    for i in range(max_checks):
        time.sleep(1.5)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT status, result_text, error FROM jobs WHERE id = %s", (job_id,))
            row = cur.fetchone()
            if row:
                status = row["status"]
                print(f"Check {i+1}: status is '{status}'")
                if status in ["completed", "failed", "cancelled"]:
                    if status == "completed":
                        print(f"SUCCESS: Job completed. Reply:\n{row['result_text']}")
                    else:
                        print(f"FAILED: Job finished with status '{status}'. Error: {row['error']}")
                    break
            else:
                print(f"Check {i+1}: Job not found in DB yet.")
    
    # 3. Print events timeline
    print("\nTimeline Events:")
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT event_type, payload, created_at FROM events WHERE job_id = %s ORDER BY id ASC", (job_id,))
        rows = cur.fetchall()
        for row in rows:
            print(f"[{row['created_at'].isoformat()}] Event: {row['event_type']} - Payload: {row['payload']}")
            
    conn.close()
    return status == "completed"

def test_job_cancellation():
    print("\n=== Test 2: Job Cancellation ===")
    
    # 1. Submit job
    payload = {
        "message": "Formulate a long reasoning about quantum computing.",
        "profile": "dev_deep"
    }
    r = requests.post(f"{BASE_URL}/v1/chat", json=payload, headers=HEADERS)
    if r.status_code != 201:
        print(f"FAILED: Submit job returned {r.status_code}: {r.text}")
        return False
    
    job_data = r.json()
    job_id = job_data["job_id"]
    print(f"Successfully submitted Job ID for cancel test: {job_id}")
    
    # Wait 1.5 seconds for the job to pick up and start running
    time.sleep(1.5)
    
    # 2. Cancel job
    print("Sending cancel request...")
    cancel_url = f"{BASE_URL}/v1/jobs/{job_id}/cancel"
    r_cancel = requests.post(cancel_url, json={}, headers=HEADERS)
    if r_cancel.status_code != 200:
        print(f"FAILED: Cancel endpoint returned {r_cancel.status_code}: {r_cancel.text}")
        return False
    
    print(f"Cancel request response: {r_cancel.text}")
    
    # 3. Verify status in DB is cancelled
    conn = get_db_connection()
    time.sleep(2.0) # wait for worker to process interrupt
    status = "running"
    for i in range(5):
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT status, error FROM jobs WHERE id = %s", (job_id,))
            row = cur.fetchone()
            if row:
                status = row["status"]
                print(f"Cancel Poll {i+1}: status is '{status}'")
                if status == "cancelled":
                    break
        time.sleep(1.0)

    if status == "cancelled":
        print("SUCCESS: Job was successfully cancelled!")
    else:
        print(f"FAILED: Job was not cancelled, final status is: {status}")
            
    # 4. Print events timeline
    print("\nCancellation Timeline Events:")
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT event_type, payload, created_at FROM events WHERE job_id = %s ORDER BY id ASC", (job_id,))
        rows = cur.fetchall()
        for row in rows:
            print(f"[{row['created_at'].isoformat()}] Event: {row['event_type']} - Payload: {row['payload']}")
            
    conn.close()
    return status == "cancelled"

if __name__ == "__main__":
    print("Starting CLAW System Integration Test...")
    success1 = test_full_job_flow()
    success2 = test_job_cancellation()
    if success1 and success2:
        print("\nALL INTEGRATION TESTS PASSED SUCCESSFULLY!")
    else:
        print("\nINTEGRATION TESTS FAILED!")
