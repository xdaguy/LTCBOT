from binance.client import Client
from binance.enums import *
from .config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BinanceClient:
    def __init__(self):
        self.client = Client(settings.binance_api_key, settings.binance_api_secret)
        self.symbol = settings.symbol
        self.test_mode = settings.test_mode
        
    def get_symbol_info(self):
        """Get symbol information"""
        try:
            return self.client.futures_exchange_info()
        except Exception as e:
            logger.error(f"Error getting symbol info: {e}")
            return None

    def get_account_balance(self):
        """Get futures account balance"""
        try:
            return self.client.futures_account_balance()
        except Exception as e:
            logger.error(f"Error getting account balance: {e}")
            return None

    def place_order(self, side: str, quantity: float, order_type: str = ORDER_TYPE_MARKET):
        """Place a futures order"""
        try:
            if self.test_mode:
                return self.client.futures_create_test_order(
                    symbol=self.symbol,
                    side=side,
                    type=order_type,
                    quantity=quantity
                )
            else:
                return self.client.futures_create_order(
                    symbol=self.symbol,
                    side=side,
                    type=order_type,
                    quantity=quantity
                )
        except Exception as e:
            logger.error(f"Error placing order: {e}")
            return None

    def get_position_info(self):
        """Get current position information"""
        try:
            positions = self.client.futures_position_information()
            return next((position for position in positions if position['symbol'] == self.symbol), None)
        except Exception as e:
            logger.error(f"Error getting position info: {e}")
            return None

    def get_mark_price(self):
        """Get current mark price"""
        try:
            mark_price = self.client.futures_mark_price(symbol=self.symbol)
            return float(mark_price['markPrice'])
        except Exception as e:
            logger.error(f"Error getting mark price: {e}")
            return None

binance_client = BinanceClient() 