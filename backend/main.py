from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.binance_client import binance_client
from app.strategy import strategy
from app.websocket import binance_ws
from app.config import settings
from binance.enums import *
import asyncio
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="LTC Trading Bot")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store background tasks
background_tasks = set()

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
    price = binance_client.get_mark_price()
    if not price:
        raise HTTPException(status_code=500, detail="Failed to fetch price")
    return {"price": price}

@app.get("/signal")
async def get_trading_signal():
    """Get current trading signal based on NASO-CULO strategy"""
    signal = strategy.get_signal()
    if not signal:
        raise HTTPException(status_code=500, detail="Failed to generate trading signal")
    return signal

@app.post("/trade")
async def execute_trade(side: str, quantity: float):
    """Execute a manual trade"""
    if side not in ['BUY', 'SELL']:
        raise HTTPException(status_code=400, detail="Invalid side. Must be 'BUY' or 'SELL'")
    
    result = binance_client.place_order(side=side, quantity=quantity)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to execute trade")
    return result

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 