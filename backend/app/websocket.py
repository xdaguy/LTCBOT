import json
import asyncio
import websockets
from .config import settings
from .strategy import strategy
from .binance_client import binance_client
import logging

logger = logging.getLogger(__name__)

class BinanceWebSocket:
    def __init__(self):
        self.ws_url = settings.ws_url
        self.symbol = settings.symbol.lower()
        self.active_connections = set()
        self.last_price = None
        self.is_trading = False
        self.position_size = 0.1  # Default position size in LTC

    async def connect(self):
        """Connect to Binance WebSocket"""
        stream_url = f"{self.ws_url}/{self.symbol}@markPrice@1s"
        async with websockets.connect(stream_url) as ws:
            logger.info(f"Connected to Binance WebSocket for {self.symbol}")
            
            # Subscribe to mark price stream
            while True:
                try:
                    message = await ws.recv()
                    await self.handle_message(message)
                except Exception as e:
                    logger.error(f"WebSocket error: {e}")
                    break

    async def handle_message(self, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            self.last_price = float(data['p'])  # Mark price

            # Get trading signal which includes all indicators
            signal_data = strategy.get_signal()
            
            if signal_data:
                # Get chart data for all timeframes
                chart_data_1m = strategy.get_chart_data('1m')
                chart_data_15m = strategy.get_chart_data('15m')
                chart_data_1h = strategy.get_chart_data('1h')

                # Prepare data for broadcast
                broadcast_data = {
                    'price': self.last_price,
                    'signal': signal_data['signal'],
                    'timestamp': data['E'],
                    'rsi': signal_data['rsi'],
                    'ema_short': signal_data['ema_short'],
                    'ema_long': signal_data['ema_long'],
                    'timeframe': signal_data['timeframe'],
                    'ema_trend': signal_data['ema_trend'],
                    'trend_strength': signal_data['trend_strength'],
                    'indicators': signal_data['indicators'],
                    'stop_loss': signal_data['stop_loss'],
                    'take_profit': signal_data['take_profit'],
                    'chart_data_1m': chart_data_1m,
                    'chart_data_15m': chart_data_15m,
                    'chart_data_1h': chart_data_1h
                }

                if signal_data['signal'] != 'HOLD' and self.is_trading:
                    await self.execute_automated_trading(signal_data)

                # Broadcast data to all connected clients
                await self.broadcast(broadcast_data)

        except Exception as e:
            logger.error(f"Error handling message: {e}")

    async def execute_automated_trading(self, signal):
        """Execute trades based on strategy signals"""
        try:
            current_position = binance_client.get_position_info()
            position_amount = float(current_position['positionAmt']) if current_position else 0

            if signal['signal'] == 'BUY' and position_amount <= 0:
                # Close any existing short position
                if position_amount < 0:
                    await self.close_position()
                
                # Open long position
                result = binance_client.place_order(
                    side='BUY',
                    quantity=self.position_size
                )
                if result:
                    logger.info(f"Opened LONG position: {result}")

            elif signal['signal'] == 'SELL' and position_amount >= 0:
                # Close any existing long position
                if position_amount > 0:
                    await self.close_position()
                
                # Open short position
                result = binance_client.place_order(
                    side='SELL',
                    quantity=self.position_size
                )
                if result:
                    logger.info(f"Opened SHORT position: {result}")

        except Exception as e:
            logger.error(f"Error executing automated trade: {e}")

    async def close_position(self):
        """Close any existing position"""
        try:
            position = binance_client.get_position_info()
            if position and float(position['positionAmt']) != 0:
                side = 'SELL' if float(position['positionAmt']) > 0 else 'BUY'
                quantity = abs(float(position['positionAmt']))
                
                result = binance_client.place_order(
                    side=side,
                    quantity=quantity
                )
                if result:
                    logger.info(f"Closed position: {result}")
                
        except Exception as e:
            logger.error(f"Error closing position: {e}")

    async def broadcast(self, message):
        """Broadcast message to all connected clients"""
        if self.active_connections:
            await asyncio.gather(
                *[connection.send_json(message) for connection in self.active_connections]
            )

    def start_trading(self):
        """Enable automated trading"""
        self.is_trading = True
        logger.info("Automated trading enabled")

    def stop_trading(self):
        """Disable automated trading"""
        self.is_trading = False
        logger.info("Automated trading disabled")

binance_ws = BinanceWebSocket() 