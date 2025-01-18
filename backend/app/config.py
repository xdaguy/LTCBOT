from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseModel):
    # Binance API Configuration
    binance_api_key: str = os.getenv("BINANCE_API_KEY", "")
    binance_api_secret: str = os.getenv("BINANCE_API_SECRET", "")
    
    # Trading Configuration
    symbol: str = "LTCUSDT"
    test_mode: bool = True  # Set to False for real trading
    
    # Database Configuration
    database_url: str = "sqlite:///./trades.db"
    
    # WebSocket Configuration
    ws_url: str = "wss://fstream.binance.com/ws"  # Binance Futures WebSocket URL

settings = Settings() 