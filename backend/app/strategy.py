import pandas as pd
import numpy as np
from ta.trend import EMAIndicator, ADXIndicator
from ta.momentum import RSIIndicator
from ta.volatility import AverageTrueRange
from ta.volume import VolumeWeightedAveragePrice
from .binance_client import binance_client
import logging

logger = logging.getLogger(__name__)

class NasoCuloStrategy:
    def __init__(self):
        self.client = binance_client
        self.timeframe = '15m'
        self.rsi_period = 14
        self.ema_short_period = 9
        self.ema_long_period = 21
        self.rsi_overbought = 70
        self.rsi_oversold = 30
        self.adx_period = 14
        self.adx_threshold = 25
        self.min_ema_distance = 0.1
        self.min_volume_threshold = 0.8
        self.min_candle_size = 0.05
        
        # Stop Loss and Take Profit settings
        self.atr_period = 14
        self.atr_multiplier_tp = 3.0  # Take Profit at 3x ATR
        self.atr_multiplier_sl = 1.5  # Stop Loss at 1.5x ATR
        self.min_risk_reward = 2.0    # Minimum risk/reward ratio
        self.max_sl_percent = 2.0     # Maximum stop loss percentage
        self.min_tp_percent = 1.0     # Minimum take profit percentage

    def fetch_historical_data(self, limit=100, timeframe=None):
        """Fetch historical klines/candlestick data"""
        try:
            tf = timeframe or self.timeframe
            logger.info(f"Fetching {tf} data with limit {limit}")
            klines = self.client.client.futures_klines(
                symbol=self.client.symbol,
                interval=tf,
                limit=limit
            )
            df = pd.DataFrame(klines, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_volume', 'trades', 'taker_buy_base',
                'taker_buy_quote', 'ignore'
            ])
            
            # Convert all necessary columns to numeric
            numeric_columns = ['open', 'high', 'low', 'close', 'volume', 
                             'quote_volume', 'trades', 'taker_buy_base', 
                             'taker_buy_quote']
            
            for col in numeric_columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # Convert timestamps
            df['timestamp'] = pd.to_numeric(df['timestamp'])
            df['close_time'] = pd.to_numeric(df['close_time'])
            
            logger.info(f"Fetched {len(df)} {tf} candles")
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

            # Calculate EMAs
            ema_short = EMAIndicator(df['close'], self.ema_short_period)
            ema_long = EMAIndicator(df['close'], self.ema_long_period)
            df['ema_short'] = ema_short.ema_indicator()
            df['ema_long'] = ema_long.ema_indicator()

            # Calculate ADX
            adx = ADXIndicator(high=df['high'], low=df['low'], close=df['close'], window=self.adx_period)
            df['adx'] = adx.adx()
            df['adx_pos'] = adx.adx_pos()
            df['adx_neg'] = adx.adx_neg()

            # Calculate ATR for dynamic SL/TP
            atr = AverageTrueRange(high=df['high'], low=df['low'], close=df['close'], window=self.atr_period)
            df['atr'] = atr.average_true_range()

            # Calculate volume metrics
            df['avg_volume'] = df['volume'].rolling(window=20).mean()
            df['volume_ratio'] = df['volume'] / df['avg_volume']
            
            # Calculate candle size as percentage
            df['candle_size'] = abs(df['close'] - df['open']) / df['close'] * 100

            # Calculate EMA distance as percentage
            df['ema_distance'] = abs(df['ema_short'] - df['ema_long']) / df['close'] * 100

            logger.info(f"Latest {self.timeframe} indicators - RSI: {df['rsi'].iloc[-1]:.2f}, "
                       f"ADX: {df['adx'].iloc[-1]:.2f}, ATR: {df['atr'].iloc[-1]:.2f}")

            return df
        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            return None

    def calculate_sl_tp(self, entry_price: float, side: str, atr_value: float, adx_value: float) -> tuple:
        """Calculate Stop Loss and Take Profit levels based on ATR and trend strength"""
        try:
            # Adjust ATR multipliers based on trend strength (ADX)
            atr_adj = 1.0 + (adx_value - self.adx_threshold) / 100
            tp_multiplier = self.atr_multiplier_tp * atr_adj
            sl_multiplier = self.atr_multiplier_sl * atr_adj

            if side == 'BUY':
                # Calculate base levels
                sl_price = entry_price - (atr_value * sl_multiplier)
                tp_price = entry_price + (atr_value * tp_multiplier)
                
                # Calculate percentages
                sl_percent = (entry_price - sl_price) / entry_price * 100
                tp_percent = (tp_price - entry_price) / entry_price * 100
                
                # Apply safety limits
                if sl_percent > self.max_sl_percent:
                    sl_price = entry_price * (1 - self.max_sl_percent/100)
                if tp_percent < self.min_tp_percent:
                    tp_price = entry_price * (1 + self.min_tp_percent/100)
                
            else:  # SELL
                # Calculate base levels
                sl_price = entry_price + (atr_value * sl_multiplier)
                tp_price = entry_price - (atr_value * tp_multiplier)
                
                # Calculate percentages
                sl_percent = (sl_price - entry_price) / entry_price * 100
                tp_percent = (entry_price - tp_price) / entry_price * 100
                
                # Apply safety limits
                if sl_percent > self.max_sl_percent:
                    sl_price = entry_price * (1 + self.max_sl_percent/100)
                if tp_percent < self.min_tp_percent:
                    tp_price = entry_price * (1 - self.min_tp_percent/100)

            # Ensure minimum risk/reward ratio
            actual_risk = abs(entry_price - sl_price)
            actual_reward = abs(tp_price - entry_price)
            if (actual_reward / actual_risk) < self.min_risk_reward:
                # Adjust TP to meet minimum R/R ratio
                if side == 'BUY':
                    tp_price = entry_price + (actual_risk * self.min_risk_reward)
                else:
                    tp_price = entry_price - (actual_risk * self.min_risk_reward)

            return round(sl_price, 2), round(tp_price, 2)

        except Exception as e:
            logger.error(f"Error calculating SL/TP levels: {e}")
            return None, None

    def get_signal(self):
        """Generate trading signal based on enhanced NASO-CULO strategy"""
        try:
            # Fetch and prepare data
            df = self.fetch_historical_data(limit=100)
            if df is None:
                return None

            df = self.calculate_indicators(df)
            if df is None:
                return None

            # Get latest values
            latest = df.iloc[-1]
            prev = df.iloc[-2]
            prev2 = df.iloc[-3]

            # 1. EMA Trend and Crossover with minimum distance
            ema_trend = 'BULLISH' if latest['ema_short'] > latest['ema_long'] else 'BEARISH'
            ema_cross_up = (prev['ema_short'] <= prev['ema_long'] and 
                          latest['ema_short'] > latest['ema_long'] and 
                          latest['ema_distance'] >= self.min_ema_distance)
            ema_cross_down = (prev['ema_short'] >= prev['ema_long'] and 
                           latest['ema_short'] < latest['ema_long'] and 
                           latest['ema_distance'] >= self.min_ema_distance)

            # 2. RSI Conditions with confirmation
            rsi_oversold = latest['rsi'] < self.rsi_oversold and prev['rsi'] < self.rsi_oversold
            rsi_overbought = latest['rsi'] > self.rsi_overbought and prev['rsi'] > self.rsi_overbought
            rsi_trend_up = latest['rsi'] > prev['rsi'] > prev2['rsi']
            rsi_trend_down = latest['rsi'] < prev['rsi'] < prev2['rsi']

            # 3. Volume and ADX Confirmation
            strong_volume = latest['volume_ratio'] >= self.min_volume_threshold
            strong_trend = latest['adx'] > self.adx_threshold
            trend_direction = latest['adx_pos'] > latest['adx_neg']

            # 4. Candle Size Filter
            valid_candle_size = latest['candle_size'] >= self.min_candle_size

            # Generate signals with SL/TP levels
            signal = 'HOLD'
            sl_price = None
            tp_price = None

            current_price = float(latest['close'])

            if (ema_cross_up and rsi_oversold and rsi_trend_up and 
                strong_volume and strong_trend and trend_direction and valid_candle_size):
                signal = 'BUY'
                sl_price, tp_price = self.calculate_sl_tp(
                    current_price, 'BUY', 
                    float(latest['atr']), 
                    float(latest['adx'])
                )
                logger.info(f"BUY Signal: Price: {current_price:.2f}, SL: {sl_price:.2f}, TP: {tp_price:.2f}")

            elif (ema_cross_down and rsi_overbought and rsi_trend_down and 
                  strong_volume and strong_trend and not trend_direction and valid_candle_size):
                signal = 'SELL'
                sl_price, tp_price = self.calculate_sl_tp(
                    current_price, 'SELL', 
                    float(latest['atr']), 
                    float(latest['adx'])
                )
                logger.info(f"SELL Signal: Price: {current_price:.2f}, SL: {sl_price:.2f}, TP: {tp_price:.2f}")

            # Return comprehensive data with SL/TP
            response_data = {
                'signal': signal,
                'price': current_price,
                'stop_loss': sl_price,
                'take_profit': tp_price,
                'rsi': float(latest['rsi']),
                'ema_short': float(latest['ema_short']),
                'ema_long': float(latest['ema_long']),
                'timeframe': self.timeframe,
                'ema_trend': ema_trend,
                'rsi_status': 'OVERBOUGHT' if latest['rsi'] > self.rsi_overbought else 'OVERSOLD' if latest['rsi'] < self.rsi_oversold else 'NEUTRAL',
                'trend_strength': 'STRONG' if strong_trend else 'WEAK',
                'volume_strength': 'HIGH' if strong_volume else 'LOW',
                'adx': float(latest['adx']),
                'atr': float(latest['atr']),
                'indicators': {
                    'rsi_period': self.rsi_period,
                    'ema_short_period': self.ema_short_period,
                    'ema_long_period': self.ema_long_period,
                    'rsi_overbought': self.rsi_overbought,
                    'rsi_oversold': self.rsi_oversold,
                    'adx_value': float(latest['adx']),
                    'volume_ratio': float(latest['volume_ratio']),
                    'candle_size': float(latest['candle_size']),
                    'ema_distance': float(latest['ema_distance'])
                }
            }
            return response_data

        except Exception as e:
            logger.error(f"Error generating signal: {e}")
            return None

    def get_chart_data(self, timeframe):
        """Get formatted chart data for a specific timeframe"""
        # Use different limits based on timeframe
        if timeframe == '1m':
            limit = 30  # Last 30 minutes
        elif timeframe == '15m':
            limit = 20  # Last 5 hours
        else:  # 1h
            limit = 24  # Last day

        df = self.fetch_historical_data(limit=limit, timeframe=timeframe)
        if df is not None:
            chart_data = []
            for _, row in df.iterrows():
                chart_data.append({
                    'time': int(row['timestamp'] / 1000),  # Convert to seconds
                    'value': float(row['close'])
                })
            return chart_data
        return []

strategy = NasoCuloStrategy() 