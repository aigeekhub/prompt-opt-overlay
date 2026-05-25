import os
import time
import requests
import json
import logging
import html
import asyncio
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from security import is_user_allowed, is_user_admin, verify_admin_pin, get_tenant_id

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Load env variables
load_dotenv()

# Constants
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://gateway:3000")
GATEWAY_API_KEY = os.getenv("GATEWAY_API_KEY", "mobu_secret_token_2026_dev")

# In-memory tracking for pending confirmation actions
# Format: { user_id: { "action": "kill", "job_id": "...", "timestamp": float } }
pending_actions = {}

def restricted(func):
    async def wrapped(update: Update, context: ContextTypes.DEFAULT_TYPE, *args, **kwargs):
        user = update.effective_user
        if not user or not is_user_allowed(user.id):
            logger.warning(f"Ignored message/command from unauthorized user ID: {user.id if user else 'Unknown'}")
            return
        return await func(update, context, *args, **kwargs)
    return wrapped

@restricted
async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    help_text = (
        f"🤖 <b>Welcome to CLAW-Ops Telegram Bot!</b>\n\n"
        f"Your Telegram User ID is: <code>{user_id}</code>\n\n"
        f"<b>Available Commands:</b>\n"
        f"/run <code>&lt;prompt&gt;</code> - Submit a prompt/task\n"
        f"/status <code>&lt;job_id&gt;</code> - Check status & timeline\n"
        f"/kill <code>&lt;job_id&gt;</code> - Cancel a running job\n"
        f"/help - Show this guide"
    )
    await update.message.reply_html(help_text)

@restricted
async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await start_handler(update, context)

@restricted
async def run_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Extract prompt text
    command_text = "/run"
    msg_text = update.message.text
    if msg_text.startswith(command_text):
        prompt = msg_text[len(command_text):].strip()
    else:
        prompt = ""

    if not prompt:
        await update.message.reply_html("❌ <b>Usage:</b> /run <code>&lt;your prompt&gt;</code>")
        return

    user_id = update.effective_user.id
    status_msg = await update.message.reply_html("⏳ Submitting job to Gateway...")

    try:
        headers = {
            "Authorization": f"Bearer {GATEWAY_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "message": prompt,
            "profile": "default_fast"
        }
        url = f"{GATEWAY_URL}/v1/chat"

        loop = asyncio.get_running_loop()
        def do_post():
            return requests.post(url, json=payload, headers=headers, timeout=10)

        response = await loop.run_in_executor(None, do_post)

        if response.status_code == 201:
            res_data = response.json()
            job_id = res_data.get("job_id")
            session_id = res_data.get("session_id")
            status = res_data.get("status")
            
            reply_text = (
                f"🚀 <b>Job Queued Successfully!</b>\n\n"
                f"<b>Job ID:</b> <code>{job_id}</code>\n"
                f"<b>Session ID:</b> <code>{session_id}</code>\n"
                f"<b>Status:</b> <code>{status}</code>\n\n"
                f"Check status with:\n/status <code>{job_id}</code>"
            )
            await status_msg.edit_text(reply_text, parse_mode="HTML")
        else:
            await status_msg.edit_text(
                f"❌ <b>Gateway returned error {response.status_code}:</b>\n<code>{html.escape(response.text)}</code>", 
                parse_mode="HTML"
            )
    except Exception as e:
        logger.error(f"Error submitting job: {e}")
        await status_msg.edit_text(f"❌ <b>Failed to connect to Gateway:</b>\n<code>{html.escape(str(e))}</code>", parse_mode="HTML")

@restricted
async def status_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_html("❌ <b>Usage:</b> /status <code>&lt;job_id&gt;</code>")
        return
        
    job_id = context.args[0].strip()
    user_id = update.effective_user.id
    tenant_id = get_tenant_id(user_id)

    loop = asyncio.get_running_loop()

    def query_db():
        from security import get_db_connection
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """SELECT id, status, profile, input_text, result_text, error, created_at, started_at, completed_at 
                       FROM jobs WHERE id = %s AND tenant_id = %s""",
                    (job_id, tenant_id)
                )
                job = cur.fetchone()
                
                if not job:
                    return None, None
                    
                cur.execute(
                    """SELECT event_type, payload, created_at 
                       FROM events WHERE job_id = %s AND tenant_id = %s 
                       ORDER BY id ASC""",
                    (job_id, tenant_id)
                )
                events = cur.fetchall()
                return job, events
        finally:
            conn.close()

    try:
        job, events = await loop.run_in_executor(None, query_db)
        
        if not job:
            await update.message.reply_html(f"❌ Job <code>{html.escape(job_id)}</code> not found.")
            return

        def esc(t):
            return html.escape(str(t)) if t else ""

        status = job["status"]
        profile = job["profile"]
        input_text = job["input_text"]
        result_text = job["result_text"]
        error = job["error"]
        created_at = job["created_at"]

        msg_parts = [
            f"📋 <b>Job Status: {esc(status.upper())}</b>",
            f"<b>Job ID:</b> <code>{esc(job_id)}</code>",
            f"<b>Profile:</b> <code>{esc(profile)}</code>",
        ]
        if created_at:
            msg_parts.append(f"<b>Created:</b> {created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC")

        msg_parts.append(f"\n<b>Input:</b>\n<code>{esc(input_text)}</code>")

        if result_text:
            msg_parts.append(f"\n<b>Result:</b>\n<pre>{esc(result_text)}</pre>")
        elif error:
            msg_parts.append(f"\n<b>Error:</b>\n<code>{esc(error)}</code>")

        if events:
            msg_parts.append("\n<b>Timeline Events:</b>")
            for ev in events:
                time_str = ev["created_at"].strftime("%H:%M:%S")
                ev_type = ev["event_type"]
                payload = ev["payload"]
                if isinstance(payload, str):
                    try:
                        payload = json.loads(payload)
                    except Exception:
                        payload = {}
                
                if ev_type == "job.queued":
                    msg_parts.append(f"🕒 [{time_str}] <b>Queued</b>")
                elif ev_type == "job.started":
                    msg_parts.append(f"🚀 [{time_str}] <b>Started</b>")
                elif ev_type == "agent.step":
                    step = payload.get("step", "?")
                    name = payload.get("name", "step")
                    msg = payload.get("message", "")
                    msg_parts.append(f"⚙️ [{time_str}] Step {step} ({esc(name)}): {esc(msg)}")
                elif ev_type == "job.completed":
                    msg_parts.append(f"✅ [{time_str}] <b>Completed</b>")
                elif ev_type == "job.cancelled":
                    msg_parts.append(f"⏹️ [{time_str}] <b>Cancelled</b>")
                elif ev_type == "job.error":
                    err_msg = payload.get("error", "Unknown error")
                    msg_parts.append(f"❌ [{time_str}] <b>Failed:</b> {esc(err_msg)}")
                else:
                    msg_parts.append(f"ℹ️ [{time_str}] {esc(ev_type)}")

        await update.message.reply_html("\n".join(msg_parts))
    except Exception as e:
        logger.error(f"Error checking job status: {e}")
        await update.message.reply_html(f"❌ <b>Error fetching status:</b>\n<code>{esc(str(e))}</code>")

@restricted
async def kill_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # Check admin privileges
    if not is_user_admin(user_id):
        await update.message.reply_html("❌ <b>Permission Denied:</b> Admin privileges required.")
        return

    if not context.args:
        await update.message.reply_html("❌ <b>Usage:</b> /kill <code>&lt;job_id&gt;</code>")
        return

    job_id = context.args[0].strip()
    tenant_id = get_tenant_id(user_id)

    loop = asyncio.get_running_loop()

    # Query job status in DB
    def check_job():
        from security import get_db_connection
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT status FROM jobs WHERE id = %s AND tenant_id = %s", (job_id, tenant_id))
                return cur.fetchone()
        finally:
            conn.close()

    try:
        job = await loop.run_in_executor(None, check_job)
        if not job:
            await update.message.reply_html(f"❌ Job <code>{html.escape(job_id)}</code> not found.")
            return

        status = job["status"]
        if status in ["completed", "failed", "cancelled"]:
            await update.message.reply_html(f"⚠️ Job <code>{html.escape(job_id)}</code> is already in <b>{status}</b> state.")
            return

        # Setup pending action
        pending_actions[user_id] = {
            "action": "kill",
            "job_id": job_id,
            "timestamp": time.time()
        }

        confirm_text = (
            f"⚠️ <b>Destructive Action Confirmation Required</b>\n\n"
            f"You requested to cancel job <code>{html.escape(job_id)}</code> (current status: <b>{status}</b>).\n\n"
            f"Please reply directly with your <b>Admin PIN</b> within 2 minutes to execute, "
            f"or type /cancel."
        )
        await update.message.reply_html(confirm_text)

    except Exception as e:
        logger.error(f"Error preparing kill action: {e}")
        await update.message.reply_html(f"❌ <b>Error:</b>\n<code>{html.escape(str(e))}</code>")

@restricted
async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    text = update.message.text.strip()

    # Check if there's a pending action
    if user_id in pending_actions:
        action_data = pending_actions[user_id]
        
        # Check timeout (120 seconds)
        if time.time() - action_data["timestamp"] > 120:
            del pending_actions[user_id]
            await update.message.reply_html("⏱️ <b>Confirmation timeout.</b> Action cancelled.")
            return

        # Check for cancel
        if text == "/cancel":
            del pending_actions[user_id]
            await update.message.reply_html("❌ Action cancelled.")
            return

        # Verify PIN
        if verify_admin_pin(user_id, text):
            job_id = action_data["job_id"]
            del pending_actions[user_id]

            status_msg = await update.message.reply_html(
                f"⏳ Verification successful. Requesting cancel for job <code>{html.escape(job_id)}</code>..."
            )

            # Call Gateway API cancel endpoint
            try:
                loop = asyncio.get_running_loop()
                
                headers = {
                    "Authorization": f"Bearer {GATEWAY_API_KEY}",
                    "Content-Type": "application/json"
                }
                url = f"{GATEWAY_URL}/v1/jobs/{job_id}/cancel"

                def do_post():
                    return requests.post(url, json={}, headers=headers, timeout=10)

                response = await loop.run_in_executor(None, do_post)

                if response.status_code == 200:
                    await status_msg.edit_text(
                        f"✅ <b>Job Cancelled Successfully!</b>\n\nJob <code>{html.escape(job_id)}</code> has been cancelled.", 
                        parse_mode="HTML"
                    )
                else:
                    await status_msg.edit_text(
                        f"❌ <b>Gateway returned error {response.status_code}:</b>\n<code>{html.escape(response.text)}</code>", 
                        parse_mode="HTML"
                    )
            except Exception as e:
                logger.error(f"Error communicating with Gateway for cancel: {e}")
                await status_msg.edit_text(
                    f"❌ <b>Failed to connect to Gateway:</b>\n<code>{html.escape(str(e))}</code>", 
                    parse_mode="HTML"
                )
        else:
            await update.message.reply_html("❌ <b>Incorrect Admin PIN.</b> Action cancelled.")
            del pending_actions[user_id]
    else:
        await update.message.reply_html("Type /help to see the list of available commands.")

def main():
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN environment variable is not set. Exiting.")
        print("CRITICAL: TELEGRAM_BOT_TOKEN is not set. Bot cannot start.")
        sys.exit(1)

    # Initialize application
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Register handlers
    application.add_handler(CommandHandler("start", start_handler))
    application.add_handler(CommandHandler("help", help_handler))
    application.add_handler(CommandHandler("run", run_handler))
    application.add_handler(CommandHandler("status", status_handler))
    application.add_handler(CommandHandler("kill", kill_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))

    logger.info("CLAW-Ops Telegram Bot is starting polling...")
    application.run_polling()

if __name__ == "__main__":
    import sys
    main()
