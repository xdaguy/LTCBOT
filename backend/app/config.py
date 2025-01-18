from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    symbol: str = "LTCUSDT"
    ws_url: str = "wss://fstream.binance.com/ws"
    binance_api_key: str = ""
    binance_api_secret: str = ""
    testnet: bool = False
    
    # Supabase settings
    supabase_url: str = ""
    supabase_key: str = ""

    # For backward compatibility
    @property
    def api_key(self) -> str:
        return self.binance_api_key

    @property
    def api_secret(self) -> str:
        return self.binance_api_secret

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings() 