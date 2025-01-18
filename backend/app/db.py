from supabase import create_client
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
try:
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    logger.info("Successfully connected to Supabase")
except Exception as e:
    logger.error(f"Error connecting to Supabase: {e}")
    supabase = None

async def save_trade_log(trade_log: dict):
    """Save trade log to Supabase"""
    try:
        if supabase:
            data = supabase.table('trade_logs').insert(trade_log).execute()
            logger.info(f"Trade log saved to Supabase: {trade_log['message']}")
            return data
        else:
            logger.error("Supabase client not initialized")
            return None
    except Exception as e:
        logger.error(f"Error saving trade log to Supabase: {e}")
        return None

async def get_trade_logs(limit: int = 100):
    """Get trade logs from Supabase"""
    try:
        if supabase:
            data = supabase.table('trade_logs')\
                          .select('*')\
                          .order('timestamp', desc=True)\
                          .limit(limit)\
                          .execute()
            return data.data
        else:
            logger.error("Supabase client not initialized")
            return []
    except Exception as e:
        logger.error(f"Error fetching trade logs from Supabase: {e}")
        return [] 