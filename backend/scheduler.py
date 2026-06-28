from apscheduler.schedulers.asyncio import AsyncIOScheduler
from backend.routers.backup import do_backup

scheduler = AsyncIOScheduler()


@scheduler.scheduled_job("cron", minute=0)
async def hourly_backup():
    try:
        await do_backup()
    except Exception as e:
        print(f"[backup] Error during scheduled backup: {e}")
