#!/bin/bash

# Content Extractor Pro
# Startup Script

echo "⚡ Content Extractor Pro"
echo "=================================================="
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Install Python dependencies if requirements.txt exists
if [ -f "config/requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r config/requirements.txt
    echo ""
fi

echo "🚀 Starting servers..."
echo ""

# --- React App (preferred) ---
if command -v node &> /dev/null && [ -d "app" ]; then
    echo "▶️  Starting React App (Port 5173)..."
    cd app

    # Install npm deps if not present
    if [ ! -d "node_modules" ]; then
        echo "   Installing npm dependencies..."
        npm install
    fi

    # Build and preview (production), or dev server
    if [ "$1" = "--dev" ]; then
        npm run dev -- --host 0.0.0.0 &
    else
        npm run build && npm run preview -- --port 5173 --host 0.0.0.0 &
    fi
    FRONTEND_PID=$!
    cd ..
    REACT_PORT=5173
else
    # Fallback: serve old vanilla HTML frontend
    echo "▶️  Starting Legacy Frontend (Port 8000)..."
    cd frontend
    python3 -m http.server 8000 &
    FRONTEND_PID=$!
    cd ..
    REACT_PORT=8000
fi

sleep 2

# Start backend server
echo "▶️  Starting Backend Server (Port 5002)..."
cd backend
python3 app.py &
BACKEND_PID=$!
cd ..

sleep 3

echo ""
echo "✅ Servers are running!"
echo "=================================================="
echo "🌐 React App:             http://localhost:${REACT_PORT}"
echo "🎬 Legacy Frontend:       http://localhost:8000/index.html"
echo "🔧 Backend API:           http://localhost:5002"
echo ""
echo "=================================================="
echo "💡 Tips:"
echo "   • Run './start.sh --dev' for hot-reload dev mode"
echo "   • Use Ctrl+C to stop all servers"
echo ""

# Function to cleanup processes on script exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    echo "✅ Servers stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Wait for processes to finish
wait 