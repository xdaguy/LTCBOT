# LTC-USDT Futures Trading Bot (NASO-CULO Strategy)

An automated trading bot for Binance Futures, specifically trading LTC-USDT pairs using the NASO-CULO strategy.

## Project Structure

```
ltcbot/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py          # Configuration and environment variables
│   │   ├── binance_client.py  # Binance API integration
│   │   ├── strategy.py        # NASO-CULO strategy implementation
│   │   └── websocket.py       # WebSocket for real-time data
│   ├── requirements.txt
│   └── main.py               # FastAPI backend entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chart.jsx     # TradingView chart component
│   │   │   ├── TradeList.jsx # Recent trades display
│   │   │   └── Stats.jsx     # Trading statistics
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── README.md
│
└── README.md
```

## Tech Stack

### Backend
- Python 3.9+
- FastAPI (Web framework)
- python-binance (Official Binance API client)
- WebSocket for real-time data
- SQLite for local data storage

### Frontend
- React 18
- TradingView Lightweight Charts
- Chakra UI (for modern UI components)
- WebSocket client for real-time updates

## Setup Instructions

### Backend Setup
1. Create a Python virtual environment:
```powershell
python -m venv venv
.\venv\Scripts\activate
```

2. Install dependencies:
```powershell
cd backend
pip install -r requirements.txt
```

3. Configure Binance API:
Create a `.env` file in the backend directory with:
```
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
```

### Frontend Setup
1. Install dependencies:
```powershell
cd frontend
npm install
```

2. Start development server:
```powershell
npm start
```

## Features
- Real-time LTC-USDT price monitoring
- Automated trading using NASO-CULO strategy
- Live trade execution visualization
- Trade history and performance metrics
- Real-time chart with trade entry/exit points
- Position size and risk management

## Development Roadmap
1. Set up basic project structure
2. Implement Binance API connection
3. Create WebSocket for real-time data
4. Implement NASO-CULO strategy
5. Develop frontend charts and trade visualization
6. Add trade history and statistics
7. Implement real-time trade execution
8. Add position management and risk controls 