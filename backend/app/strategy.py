import pandas as pd
import numpy as np
from ta.trend import EMAIndicator
from ta.momentum import RSIIndicator
from .binance_client import binance_client
import logging

logger = logging.getLogger(__name__)

class NasoCuloStrategy:
    def __init__(self):
        self.client = binance_client
        self.timeframe = '15m'  # Default timeframe
        self.rsi_period = 14
        self.ema_short_period = 9
        self.ema_long_period = 21
        self.rsi_overbought = 70
        self.rsi_oversold = 30

    def fetch_historical_data(self, limit=100):
        """Fetch historical klines/candlestick data"""
        try:
            klines = self.client.client.futures_klines(
                symbol=self.client.symbol,
                interval=self.timeframe,
                limit=limit
            )
            df = pd.DataFrame(klines, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_volume', 'trades', 'taker_buy_base',
                'taker_buy_quote', 'ignore'
            ])
            df['close'] = pd.to_numeric(df['close'])
            return df
        except Exception as e:
            logger.error(f"Error fetching historical data: {e}")
            return None

    def calculate_indicators(self, df):
        """Calculate technical indicators"""
        try:
            # Calculate RSI
            rsi = RSIIndicator(df['close'], self.rsi_period)
            df['rsi'] = rsi.rsi()

            # Calculate EMAs
            ema_short = EMAIndicator(df['close'], self.ema_short_period)
            ema_long = EMAIndicator(df['close'], self.ema_long_period)
            df['ema_short'] = ema_short.ema_indicator()
            df['ema_long'] = ema_long.ema_indicator()

            return df
        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            return None

    def get_signal(self):
        """Generate trading signal based on NASO-CULO strategy"""
        try:
            # Fetch and prepare data
            df = self.fetch_historical_data()
            if df is None:
                return None

            df = self.calculate_indicators(df)
            if df is None:
                return None

            # Get latest values
            latest = df.iloc[-1]
            prev = df.iloc[-2]

            # NASO-CULO Strategy Logic
            # 1. EMA Crossover
            ema_cross_up = prev['ema_short'] <= prev['ema_long'] and latest['ema_short'] > latest['ema_long']
            ema_cross_down = prev['ema_short'] >= prev['ema_long'] and latest['ema_short'] < latest['ema_long']

            # 2. RSI Conditions
            rsi_oversold = latest['rsi'] < self.rsi_oversold
            rsi_overbought = latest['rsi'] > self.rsi_overbought

            # Generate signals
            if ema_cross_up and rsi_oversold:
                return {
                    'signal': 'BUY',
                    'rsi': latest['rsi'],
                    'ema_short': latest['ema_short'],
                    'ema_long': latest['ema_long'],
                    'price': latest['close']
                }
            elif ema_cross_down and rsi_overbought:
                return {
                    'signal': 'SELL',
                    'rsi': latest['rsi'],
                    'ema_short': latest['ema_short'],
                    'ema_long': latest['ema_long'],
                    'price': latest['close']
                }
            else:
                return {
                    'signal': 'HOLD',
                    'rsi': latest['rsi'],
                    'ema_short': latest['ema_short'],
                    'ema_long': latest['ema_long'],
                    'price': latest['close']
                }

        except Exception as e:
            logger.error(f"Error generating signal: {e}")
            return None

strategy = NasoCuloStrategy() 