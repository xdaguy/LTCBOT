from binance.client import Client
from binance.enums import *
from .config import settings
import logging
from datetime import datetime, timedelta

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
            # Get futures account information
            account = self.client.futures_account()
            if not account:
                raise ValueError("No account information received")

            # Get USDT balance from futures wallet
            balances = account.get('assets', [])
            usdt_balance = next((b for b in balances if b['asset'] == 'USDT'), None)
            
            if not usdt_balance:
                raise ValueError("No USDT balance found in futures wallet")
                
            return {
                "status": "success",
                "balance": float(usdt_balance['walletBalance']),
                "availableBalance": float(usdt_balance['availableBalance']),
                "unrealizedProfit": float(account.get('totalUnrealizedProfit', 0))
            }
        except ValueError as ve:
            logger.error(f"Balance error: {ve}")
            return {
                "status": "error",
                "message": str(ve),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error getting account balance: {e}")
            return {
                "status": "error",
                "message": f"Failed to fetch balance: {str(e)}",
                "error_type": "binance_api_error"
            }

    def place_order(self, side: str, quantity: float, order_type: str = ORDER_TYPE_MARKET, price: float = None):
        """Place a futures order"""
        try:
            # Check account balance first
            account = self.client.futures_account()
            available_balance = float(account['availableBalance'])
            
            if available_balance <= 0:
                raise ValueError(f"Insufficient balance. Available: {available_balance} USDT")
            
            # Get current position to check if we can open new one
            position = self.get_position_info()
            if position and float(position['positionAmt']) != 0:
                raise ValueError(f"Active position exists: {position['positionAmt']} {self.symbol}")

            # Prepare order parameters
            order_params = {
                "symbol": self.symbol,
                "side": side,
                "type": order_type,
                "quantity": quantity
            }
            
            # Add price for LIMIT orders
            if order_type == ORDER_TYPE_LIMIT and price is not None:
                order_params["price"] = price
                order_params["timeInForce"] = TIME_IN_FORCE_GTC  # Good Till Cancel

            if self.test_mode:
                logger.info(f"Test Mode: Would place {order_type} {side} order for {quantity} {self.symbol}")
                return self.client.futures_create_test_order(**order_params)
            else:
                result = self.client.futures_create_order(**order_params)
                order_desc = f"{order_type} {side} order for {quantity} {self.symbol}"
                if order_type == ORDER_TYPE_LIMIT:
                    order_desc += f" at {price} USDT"
                logger.info(f"Order placed successfully: {order_desc}")
                return {
                    "status": "success",
                    "message": f"Order placed successfully: {order_desc}",
                    "order": result
                }
                
        except ValueError as ve:
            error_msg = str(ve)
            logger.error(f"Validation error placing order: {error_msg}")
            return {
                "status": "error",
                "message": error_msg,
                "error_type": "validation_error"
            }
        except Exception as e:
            error_msg = str(e)
            if "insufficient balance" in error_msg.lower():
                msg = "Insufficient balance to place order"
            elif "quantity greater than max" in error_msg.lower():
                msg = "Order quantity exceeds maximum allowed"
            elif "quantity less than min" in error_msg.lower():
                msg = "Order quantity below minimum allowed"
            elif "reduce only order" in error_msg.lower():
                msg = "Cannot open new position in reduce-only mode"
            elif "invalid price" in error_msg.lower():
                msg = "Invalid price for limit order"
            else:
                msg = f"Error placing order: {error_msg}"
            
            logger.error(msg)
            return {
                "status": "error",
                "message": msg,
                "error_type": "binance_api_error",
                "details": error_msg
            }

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
            ticker = self.client.futures_mark_price(symbol=self.symbol)
            return float(ticker['markPrice'])
        except Exception as e:
            logger.error(f"Error getting mark price: {e}")
            return None

    def get_historical_klines(self, interval="15m", limit=100):
        """Fetch historical klines/candlestick data"""
        try:
            klines = self.client.futures_klines(
                symbol=self.symbol,
                interval=interval,
                limit=limit
            )
            
            # Format klines for charting
            formatted_klines = [
                {
                    'time': datetime.fromtimestamp(k[0] / 1000).strftime('%Y-%m-%d %H:%M:%S'),
                    'value': float(k[4])  # Close price
                }
                for k in klines
            ]
            return formatted_klines
        except Exception as e:
            logger.error(f"Error fetching historical klines: {e}")
            return None

binance_client = BinanceClient() 