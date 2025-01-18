from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.binance_client import binance_client
from app.strategy import strategy
from app.websocket import binance_ws
from app.config import settings
from app.db import save_trade_log, get_trade_logs
from binance.enums import *
import asyncio
import logging
from datetime import datetime
from typing import List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)

# Reduce noise from third-party libraries
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('websockets').setLevel(logging.WARNING)
logging.getLogger('asyncio').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

app = FastAPI(title="LTC Trading Bot")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store trade logs in memory
trade_logs = []

# Store background tasks
background_tasks = set()

class TradeLog(BaseModel):
    timestamp: str
    type: str
    side: str
    quantity: float
    price: Optional[float] = None
    status: str
    message: str

async def add_trade_log(type: str, side: str, quantity: float, price: Optional[float], status: str, message: str):
    """Add a new trade log entry"""
    trade_log = {
        "timestamp": datetime.now().isoformat(),
        "type": type,
        "side": side,
        "quantity": quantity,
        "price": price,
        "status": status,
        "message": message
    }
    
    # Save to Supabase
    await save_trade_log(trade_log)
    return TradeLog(**trade_log)

@app.get("/trade-logs", response_model=List[TradeLog])
async def get_trade_history():
    """Get all trade logs from Supabase"""
    logs = await get_trade_logs(limit=100)
    return [TradeLog(**log) for log in logs]

@app.post("/trade")
async def execute_trade(trade_request: dict):
    """Execute a trade based on the request"""
    try:
        side = trade_request.get("side", "").upper()
        order_type = trade_request.get("type", "MARKET").upper()
        quantity = float(trade_request.get("quantity", 0))
        price = float(trade_request.get("price", 0)) if "price" in trade_request else None

        # Validate required fields
        if not side or side not in ["BUY", "SELL"]:
            raise HTTPException(status_code=400, detail="Invalid side. Must be BUY or SELL")
        if not quantity or quantity <= 0:
            raise HTTPException(status_code=400, detail="Invalid quantity. Must be greater than 0")
        if order_type not in ["MARKET", "LIMIT"]:
            raise HTTPException(status_code=400, detail="Invalid order type. Must be MARKET or LIMIT")
        if order_type == "LIMIT" and (not price or price <= 0):
            raise HTTPException(status_code=400, detail="Price is required for LIMIT orders and must be greater than 0")

        # Place the order
        result = binance_client.place_order(side=side, quantity=quantity, order_type=order_type, price=price)
        
        if result.get("status") == "error":
            # Log failed trade
            await add_trade_log(
                type=order_type,
                side=side,
                quantity=quantity,
                price=price,
                status="error",
                message=result.get("message", "Unknown error")
            )
            raise HTTPException(status_code=400, detail=result.get("message", "Unknown error placing order"))
        
        # Log successful trade
        await add_trade_log(
            type=order_type,
            side=side,
            quantity=quantity,
            price=price,
            status="success",
            message=result.get("message", f"Successfully placed {order_type} {side} order")
        )
            
        return result
        
    except HTTPException as he:
        raise he
    except ValueError as ve:
        # Log validation error
        await add_trade_log(
            type=order_type if 'order_type' in locals() else "UNKNOWN",
            side=side if 'side' in locals() else "UNKNOWN",
            quantity=quantity if 'quantity' in locals() else 0,
            price=price if 'price' in locals() else None,
            status="error",
            message=str(ve)
        )
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Log unexpected error
        await add_trade_log(
            type=order_type if 'order_type' in locals() else "UNKNOWN",
            side=side if 'side' in locals() else "UNKNOWN",
            quantity=quantity if 'quantity' in locals() else 0,
            price=price if 'price' in locals() else None,
            status="error",
            message=f"Unexpected error: {str(e)}"
        )
        logger.error(f"Error executing trade: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error executing trade")

@app.on_event("startup")
async def startup_event():
    # Start WebSocket connection in the background
    task = asyncio.create_task(binance_ws.connect())
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)

@app.on_event("shutdown")
async def shutdown_event():
    # Stop automated trading and clean up tasks
    binance_ws.stop_trading()
    for task in background_tasks:
        task.cancel()

@app.get("/")
async def root():
    return {"status": "running", "symbol": settings.symbol}

@app.get("/balance")
async def get_balance():
    balance = binance_client.get_account_balance()
    if not balance:
        raise HTTPException(status_code=500, detail="Failed to fetch balance")
    return balance

@app.get("/position")
async def get_position():
    position = binance_client.get_position_info()
    if not position:
        raise HTTPException(status_code=500, detail="Failed to fetch position")
    return position

@app.get("/price")
async def get_price():
    try:
        price = binance_client.get_mark_price()
        if not price:
            raise HTTPException(status_code=500, detail="Failed to fetch price")
        
        # Get historical data for different timeframes
        klines_1m = binance_client.get_historical_klines(interval="1m", limit=30)
        klines_15m = binance_client.get_historical_klines(interval="15m", limit=48)
        klines_1h = binance_client.get_historical_klines(interval="1h", limit=48)
        
        # Get trading signal and indicators
        signal_data = strategy.get_signal()
        if not signal_data:
            raise HTTPException(status_code=500, detail="Failed to get trading signal")
            
        # Only log significant changes in signal or indicators
        if signal_data.get("signal") != "HOLD":
            logger.info(f"New trading signal: {signal_data.get('signal')} (RSI: {signal_data.get('rsi', 'N/A'):.2f})")
        
        response_data = {
            "price": price,
            "signal": signal_data.get("signal"),
            "rsi": signal_data.get("rsi"),
            "ema_short": signal_data.get("ema_short"),
            "ema_long": signal_data.get("ema_long"),
            "timeframe": signal_data.get("timeframe"),
            "ema_trend": signal_data.get("ema_trend"),
            "rsi_status": signal_data.get("rsi_status"),
            "trend_strength": signal_data.get("trend_strength"),
            "indicators": signal_data.get("indicators"),
            "chart_data_1m": klines_1m if klines_1m else [],
            "chart_data_15m": klines_15m if klines_15m else [],
            "chart_data_1h": klines_1h if klines_1h else []
        }
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error in price endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/signal")
async def get_trading_signal():
    """Get current trading signal based on NASO-CULO strategy"""
    signal = strategy.get_signal()
    if not signal:
        raise HTTPException(status_code=500, detail="Failed to generate trading signal")
    return signal

@app.post("/autotrading/start")
async def start_automated_trading():
    """Start automated trading"""
    try:
        binance_ws.start_trading()
        return {"status": "success", "message": "Automated trading started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/autotrading/stop")
async def stop_automated_trading():
    """Stop automated trading"""
    try:
        binance_ws.stop_trading()
        return {"status": "success", "message": "Automated trading stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/autotrading/status")
async def get_automated_trading_status():
    """Get automated trading status"""
    return {
        "is_trading": binance_ws.is_trading,
        "position_size": binance_ws.position_size
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    binance_ws.active_connections.add(websocket)
    try:
        while True:
            # Keep the connection alive and handle any incoming messages
            data = await websocket.receive_text()
            # You can add custom message handling here if needed
    except WebSocketDisconnect:
        binance_ws.active_connections.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        binance_ws.active_connections.remove(websocket)

@app.get("/account")
async def get_account():
    """Get futures account information"""
    try:
        account = binance_client.client.futures_account()
        if not account:
            raise HTTPException(status_code=500, detail="Failed to get account information")
        
        return account  # Return the full account object
    except Exception as e:
        logger.error(f"Error in account endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/positions")
async def get_positions():
    """Get all open positions"""
    try:
        positions = binance_client.client.futures_position_information()
        if not positions:
            return []
        
        # Filter out positions with zero amount
        active_positions = [
            pos for pos in positions 
            if float(pos['positionAmt']) != 0
        ]
        
        return active_positions
    except Exception as e:
        logger.error(f"Error in positions endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 