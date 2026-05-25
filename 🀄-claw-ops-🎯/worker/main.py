import os
import json
import time
import redis
from dotenv import load_dotenv
from tasks import execute_job

load_dotenv()

def get_redis_client():
    redis_password = os.getenv("REDIS_PASSWORD", "")
    redis_config = {
        "host": os.getenv("REDIS_HOST", "127.0.0.1"),
        "port": int(os.getenv("REDIS_PORT", "6379")),
    }
    if redis_password:
        redis_config["password"] = redis_password
    return redis.Redis(**redis_config)

def main():
    print("Starting CLAW Queue Bridge Listener...")
    
    r = None
    while True:
        try:
            if r is None:
                r = get_redis_client()
                print("Connected to Redis. Listening for jobs on list 'claw_ops_jobs'...")
            
            # Blocking pop (wait up to 5 seconds, then retry loop to check connection)
            result = r.blpop("claw_ops_jobs", timeout=5)
            if result:
                # result is a tuple: (list_key, value)
                queue_name, payload_str = result
                try:
                    job_data = json.loads(payload_str)
                    job_id = job_data.get("job_id")
                    print(f"Bridge received Job {job_id} from list queue. Dispatching to Celery...")
                    
                    # Dispatch to Celery task asynchronously
                    execute_job.delay(job_data)
                except Exception as e:
                    print(f"Failed to parse or dispatch job payload: {e}")
                    
        except redis.ConnectionError as ce:
            print(f"Redis connection error: {ce}. Retrying in 5 seconds...")
            r = None
            time.sleep(5)
        except Exception as e:
            print(f"Unexpected error in listener loop: {e}. Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    main()
