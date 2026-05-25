import os
from celery import Celery
from dotenv import load_dotenv

# Load env variables
load_dotenv()

redis_host = os.getenv("REDIS_HOST", "127.0.0.1")
redis_port = os.getenv("REDIS_PORT", "6379")
redis_password = os.getenv("REDIS_PASSWORD", "")

if redis_password:
    broker_url = f"redis://:{redis_password}@{redis_host}:{redis_port}/0"
else:
    broker_url = f"redis://{redis_host}:{redis_port}/0"

app = Celery("claw_ops", broker=broker_url, backend=broker_url, include=["tasks"])

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

if __name__ == "__main__":
    app.start()
