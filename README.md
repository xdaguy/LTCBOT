# LTC Trading Bot

A sophisticated cryptocurrency trading bot specialized for LTC (Litecoin) trading, featuring real-time market data analysis, automated trading strategies, and a modern web interface.

## Current Features

### Backend (FastAPI)
- Real-time WebSocket connection with Binance Futures
- Custom trading strategy implementation (NASO-CULO Strategy)
  - EMA (Exponential Moving Average) crossover detection
  - RSI (Relative Strength Index) confirmation
  - Volume analysis for trade validation
  - ADX (Average Directional Index) for trend strength confirmation
- Trade execution system with:
  - Market orders support
  - Limit orders support
  - Dynamic Stop Loss and Take Profit calculations based on ATR
- Trade logging and persistence using Supabase
- Environment-based configuration system
- Test mode support for safe testing

### Frontend (React)
- Real-time price chart with TradingView integration
- Live trade execution panel
  - Market/Limit order type selection
  - Buy/Sell side selection
  - Quantity and price inputs with validation
- Trade log display with filtering capabilities
- Responsive design for desktop and mobile
- Real-time WebSocket updates
- Toast notifications for trade status

### Trading Strategy Enhancements
- Volume confirmation for trend strength
- False signal reduction filters
- Enhanced trend analysis with ADX
- Dynamic SL/TP based on market volatility
- Circuit breaker implementation for market crashes
- Risk management features:
  - ATR-based Stop Loss (1.5x ATR)
  - ATR-based Take Profit (3.0x ATR)
  - Maximum 2% risk per trade
  - Minimum 2.0 risk/reward ratio

## Planned Features

### Short Term
1. Strategy Improvements
   - Implement market sentiment analysis
   - Add more technical indicators (MACD, Bollinger Bands)
   - Enhance entry/exit timing logic

2. Risk Management
   - Position sizing optimization
   - Portfolio risk management
   - Drawdown protection mechanisms

3. Performance Analytics
   - Trade performance dashboard
   - Win rate statistics
   - Risk-adjusted return metrics
   - Drawdown analysis

### Medium Term
1. Advanced Features
   - Multiple timeframe analysis
   - Machine learning price prediction
   - News sentiment integration
   - Backtesting module

2. User Experience
   - Strategy parameter customization UI
   - Advanced charting features
   - Mobile app development
   - Email/Telegram notifications

### Long Term
1. System Expansion
   - Multi-exchange support
   - Multiple cryptocurrency pairs
   - Portfolio rebalancing
   - Grid trading strategies

2. Enterprise Features
   - User authentication
   - Multi-user support
   - API access
   - White-label solutions

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- Binance Futures account
- Supabase account
- Git (for cloning the repository)
- Windows RDP or local Windows machine

### Environment Variables
```env
# Backend (.env)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SYMBOL=LTCUSDT
WS_URL=wss://fstream.binance.com/ws
TEST_MODE=True
```

### Installation

1. Clone the Repository
```bash
git clone <repository-url>
cd LTCBOT
```

2. Backend Setup
```powershell
# Create and activate virtual environment
cd backend
python -m venv venv
.\venv\Scripts\activate

# Install required packages one by one to avoid conflicts
pip install fastapi==0.104.1
pip install uvicorn==0.24.0
pip install python-binance==1.0.27
pip install python-dotenv==1.0.1
pip install pandas==2.2.3
pip install numpy==2.2.1
pip install ta==0.10.2
pip install websockets==12.0
pip install supabase==1.0.3
pip install httpx==0.23.3
pip install python-dateutil==2.9.0.post0
pip install postgrest==0.10.7
pip install pydantic==2.10.5
pip install pydantic-settings==2.7.1
pip install typing_extensions==4.12.2
pip install starlette==0.27.0
pip install anyio==3.7.1
pip install httpcore==0.16.3

# Optional: Update pip if needed
python -m pip install --upgrade pip

# Create .env file (copy the above environment variables)
# Start the backend server
uvicorn main:app --reload
```

3. Frontend Setup
```powershell
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### Verification Steps
1. Backend Verification:
   - Open http://localhost:8000/docs in your browser
   - Check if the FastAPI documentation loads
   - Verify WebSocket connection in the console

2. Frontend Verification:
   - Open http://localhost:3000 in your browser
   - Check if the trading interface loads
   - Verify real-time price updates
   - Test order placement in TEST_MODE

### Troubleshooting
- If you encounter package conflicts, try installing packages one by one as shown above
- Ensure all environment variables are correctly set in the .env file
- Check if the Binance API keys have the correct permissions
- Verify that the Supabase project is properly set up with the required tables
- Make sure ports 8000 and 3000 are not being used by other applications

### Note
The bot runs in test mode by default (TEST_MODE=True). This is recommended for initial setup and testing. Only switch to live trading after thorough testing and at your own risk.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This trading bot is for educational purposes only. Use it at your own risk. The developers are not responsible for any financial losses incurred while using this software. 