import os
import json
import time
import threading
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from openai import OpenAI
from celery_app import app

# Helper: Get DB connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "127.0.0.1"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        database=os.getenv("POSTGRES_DB", "claw_ops"),
        user=os.getenv("POSTGRES_USER", "mobu"),
        password=os.getenv("POSTGRES_PASSWORD", "")
    )

# Helper: Get Redis client
def get_redis_client():
    redis_password = os.getenv("REDIS_PASSWORD", "")
    redis_config = {
        "host": os.getenv("REDIS_HOST", "127.0.0.1"),
        "port": int(os.getenv("REDIS_PORT", "6379")),
    }
    if redis_password:
        redis_config["password"] = redis_password
    return redis.Redis(**redis_config)

# Redis PubSub Cancellation Listener
class CancelListener(threading.Thread):
    def __init__(self, redis_client, job_id):
        super().__init__()
        self.r = redis_client
        self.job_id = job_id
        self.pubsub = self.r.pubsub()
        self.cancelled = False
        self.daemon = True

    def run(self):
        try:
            self.pubsub.subscribe(f"claw_ops_jobs_cancel:{self.job_id}")
            for message in self.pubsub.listen():
                if message['type'] == 'message' and message['data'] == b'cancel':
                    self.cancelled = True
                    break
        except Exception:
            pass

    def stop(self):
        try:
            self.pubsub.unsubscribe()
            self.pubsub.close()
        except Exception:
            pass

# Helper: Emit event to DB and Redis
def emit_event(conn, r_client, tenant_id, job_id, event_type, payload):
    created_at = datetime.utcnow().isoformat() + "Z"
    
    # Save to PostgreSQL
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO events (tenant_id, job_id, event_type, payload) 
                   VALUES (%s, %s, %s, %s)""",
                (tenant_id, job_id, event_type, json.dumps(payload))
            )
            conn.commit()
    except Exception as e:
        print(f"Failed to write event {event_type} to PostgreSQL: {e}")
        conn.rollback()

    # Publish to Redis Pub/Sub
    try:
        event_msg = {
            "tenant_id": tenant_id,
            "job_id": job_id,
            "event_type": event_type,
            "payload": payload,
            "created_at": created_at
        }
        r_client.publish("claw_ops_events", json.dumps(event_msg))
    except Exception as e:
        print(f"Failed to publish event {event_type} to Redis: {e}")

@app.task(name="worker.tasks.execute_job")
def execute_job(job_data):
    job_id = job_data["job_id"]
    tenant_id = job_data["tenant_id"]
    session_id = job_data["session_id"]
    profile = job_data.get("profile", "default_fast")
    message = job_data["message"]

    conn = get_db_connection()
    r = get_redis_client()

    # Start cancellation listener
    cancel_listener = CancelListener(r, job_id)
    cancel_listener.start()

    try:
        # Check if job was already cancelled before starting
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT status FROM jobs WHERE id = %s", (job_id,))
            job_row = cur.fetchone()
            if job_row and job_row["status"] == "cancelled":
                print(f"Job {job_id} already cancelled before execution.")
                emit_event(conn, r, tenant_id, job_id, "job.cancelled", {"job_id": job_id})
                cancel_listener.stop()
                return

        print(f"Starting job {job_id} for tenant {tenant_id}...")
        
        # 1. Transition status to running
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status = 'running', started_at = now() WHERE id = %s",
                (job_id,)
            )
            conn.commit()

        # Emit job.started event
        emit_event(conn, r, tenant_id, job_id, "job.started", {
            "job_id": job_id,
            "session_id": session_id
        })

        # Step 1: Pre-execution analysis step
        if cancel_listener.cancelled:
            raise InterruptedError("Job cancelled by user")
            
        emit_event(conn, r, tenant_id, job_id, "agent.step", {
            "step": 1,
            "name": "analyze_input",
            "message": "Analyzing request message and selecting target LLM profile..."
        })
        time.sleep(1.5)  # Micro-delay for timeline UI visualization

        # Step 2: Model Routing and Execution
        if cancel_listener.cancelled:
            raise InterruptedError("Job cancelled by user")

        # Map profiles to OpenAI models
        model = "gpt-4o-mini"
        temperature = 0.7
        max_tokens = 4096

        if profile == "dev_deep":
            model = "gpt-4o"
            temperature = 0.3
            max_tokens = 4096
        elif profile == "bulk_cheap":
            model = "gpt-4o-mini"
            temperature = 0.5
            max_tokens = 2048

        emit_event(conn, r, tenant_id, job_id, "agent.step", {
            "step": 2,
            "name": "llm_routing",
            "message": f"Routing task to OpenAI model '{model}' with temperature={temperature}..."
        })

        # Initialize OpenAI Client
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")

        client = OpenAI(api_key=openai_api_key)

        emit_event(conn, r, tenant_id, job_id, "agent.step", {
            "step": 3,
            "name": "llm_query",
            "message": f"Querying model '{model}' for response..."
        })

        # Perform LLM call
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are CLAW, a helpful and efficient hybrid AI operating assistant."},
                {"role": "user", "content": message}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        reply_text = completion.choices[0].message.content

        if cancel_listener.cancelled:
            raise InterruptedError("Job cancelled by user")

        emit_event(conn, r, tenant_id, job_id, "agent.step", {
            "step": 4,
            "name": "finalize_result",
            "message": "Formulating final response and updating status..."
        })
        time.sleep(1)

        # 3. Transition status to completed
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status = 'completed', result_text = %s, completed_at = now() WHERE id = %s",
                (reply_text, job_id)
            )
            conn.commit()

        # Emit job.completed event
        emit_event(conn, r, tenant_id, job_id, "job.completed", {
            "job_id": job_id,
            "reply_text": reply_text
        })
        print(f"Job {job_id} completed successfully.")

    except InterruptedError as ie:
        print(f"Job {job_id} execution interrupted: {ie}")
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status = 'cancelled', completed_at = now() WHERE id = %s",
                (job_id,)
            )
            conn.commit()
        emit_event(conn, r, tenant_id, job_id, "job.cancelled", {"job_id": job_id})

    except Exception as e:
        print(f"Error executing job {job_id}: {e}")
        error_msg = str(e)
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status = 'failed', error = %s, completed_at = now() WHERE id = %s",
                (error_msg, job_id)
            )
            conn.commit()
        emit_event(conn, r, tenant_id, job_id, "job.error", {
            "job_id": job_id,
            "error": error_msg
        })

    finally:
        cancel_listener.stop()
        conn.close()
        r.close()
