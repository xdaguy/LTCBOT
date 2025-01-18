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
        self.timeframe = '15m'  # Using 15m for optimal signal generation
        self.rsi_period = 14
        self.ema_short_period = 9
        self.ema_long_period = 21
        self.rsi_overbought = 70
        self.rsi_oversold = 30

    def fetch_historical_data(self, limit=100):
        """Fetch historical klines/candlestick data"""
        try:
            logger.info(f"Fetching {self.timeframe} data with limit {limit}")
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
            logger.info(f"Fetched {len(df)} {self.timeframe} candles")
            return df
        except Exception as e:
            logger.error(f"Error fetching historical data: {e}")
            return None

    def calculate_indicators(self, df):
        """Calculate technical indicators"""
        try:
            logger.info(f"Calculating indicators for {self.timeframe} timeframe")
            # Calculate RSI
            rsi = RSIIndicator(df['close'], self.rsi_period)
            df['rsi'] = rsi.rsi()
            logger.info(f"RSI ({self.timeframe}) calculated: {df['rsi'].iloc[-1]}")

            # Calculate EMAs
            ema_short = EMAIndicator(df['close'], self.ema_short_period)
            ema_long = EMAIndicator(df['close'], self.ema_long_period)
            df['ema_short'] = ema_short.ema_indicator()
            df['ema_long'] = ema_long.ema_indicator()

            # Log latest values
            logger.info(f"Latest {self.timeframe} indicators - RSI: {df['rsi'].iloc[-1]:.2f}, EMA Short: {df['ema_short'].iloc[-1]:.2f}, EMA Long: {df['ema_long'].iloc[-1]:.2f}")

            return df
        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            return None

    def get_signal(self):
        """Generate trading signal based on NASO-CULO strategy"""
        try:
            # Fetch and prepare data
            df = self.fetch_historical_data(limit=100)  # Increased limit for better calculation
            if df is None:
                return None

            df = self.calculate_indicators(df)
            if df is None:
                return None

            # Get latest values
            latest = df.iloc[-1]
            prev = df.iloc[-2]
            prev2 = df.iloc[-3]  # Add one more candle for confirmation

            # Log values for debugging
            logger.info(f"Latest values - RSI: {latest['rsi']:.2f}, EMA Short: {latest['ema_short']:.2f}, EMA Long: {latest['ema_long']:.2f}")

            # NASO-CULO Strategy Logic
            # 1. EMA Trend and Crossover
            ema_trend = 'BULLISH' if latest['ema_short'] > latest['ema_long'] else 'BEARISH'
            ema_cross_up = prev['ema_short'] <= prev['ema_long'] and latest['ema_short'] > latest['ema_long']
            ema_cross_down = prev['ema_short'] >= prev['ema_long'] and latest['ema_short'] < latest['ema_long']

            # 2. RSI Conditions with confirmation
            rsi_oversold = latest['rsi'] < self.rsi_oversold and prev['rsi'] < self.rsi_oversold  # Two periods of oversold
            rsi_overbought = latest['rsi'] > self.rsi_overbought and prev['rsi'] > self.rsi_overbought  # Two periods of overbought
            rsi_trend_up = latest['rsi'] > prev['rsi'] > prev2['rsi']  # RSI trending up
            rsi_trend_down = latest['rsi'] < prev['rsi'] < prev2['rsi']  # RSI trending down

            # 3. Trend Strength
            trend_strength = abs(latest['ema_short'] - latest['ema_long']) / latest['close'] * 100
            is_strong_trend = trend_strength > 1.0  # 1% difference between EMAs

            # Generate signals with stronger confirmation
            signal = 'HOLD'
            if ema_cross_up and rsi_oversold and rsi_trend_up:
                signal = 'BUY'
                logger.info("BUY Signal: EMA cross up + RSI oversold + RSI trending up")
            elif ema_cross_down and rsi_overbought and rsi_trend_down:
                signal = 'SELL'
                logger.info("SELL Signal: EMA cross down + RSI overbought + RSI trending down")

            # Return comprehensive data
            response_data = {
                'signal': signal,
                'rsi': float(latest['rsi']),
                'ema_short': float(latest['ema_short']),
                'ema_long': float(latest['ema_long']),
                'price': float(latest['close']),
                'timeframe': self.timeframe,
                'ema_trend': ema_trend,
                'rsi_status': 'OVERBOUGHT' if latest['rsi'] > self.rsi_overbought else 'OVERSOLD' if latest['rsi'] < self.rsi_oversold else 'NEUTRAL',
                'trend_strength': 'STRONG' if is_strong_trend else 'WEAK',
                'indicators': {
                    'rsi_period': self.rsi_period,
                    'ema_short_period': self.ema_short_period,
                    'ema_long_period': self.ema_long_period,
                    'rsi_overbought': self.rsi_overbought,
                    'rsi_oversold': self.rsi_oversold,
                    'trend_strength_value': float(trend_strength)
                }
            }
            logger.info(f"Response data: {response_data}")
            return response_data

        except Exception as e:
            logger.error(f"Error generating signal: {e}")
            return None

strategy = NasoCuloStrategy() 