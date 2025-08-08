#!/bin/bash

# YouTube Transcript Extractor & URL Metadata Tools
# Startup Script for Organized Project Structure

echo "🎬 Starting YouTube Transcript Extractor & URL Metadata Tools"
echo "=================================================="
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Install dependencies if requirements.txt exists
if [ -f "config/requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r config/requirements.txt
    echo ""
fi

echo "🚀 Starting servers..."
echo ""

# Start frontend server
echo "▶️  Starting Frontend Server (Port 8000)..."
cd frontend
python3 -m http.server 8000 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 2

# Start backend server
echo "▶️  Starting Backend Server (Port 5002)..."
cd backend
python3 app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

echo ""
echo "✅ Servers are running!"
echo "=================================================="
echo "🌐 Frontend URLs (served from \`frontend\` as document root):"
echo "   • Main App (index):     http://localhost:8000/index.html"
echo "   • Simple URL Extractor: http://localhost:8000/simple_extractor.html"
echo "   • Reddit Downloader:    http://localhost:8000/reddit_downloader.html"
echo "   • Debug Tools:          http://localhost:8000/debug_frontend.html"
echo ""
echo "🔧 Backend API:            http://localhost:5002"
echo ""
echo "=================================================="
echo "💡 Tips:"
echo "   • Use Ctrl+C to stop both servers"
echo "   • Check logs in terminal for any errors"
echo "   • Use Debug Tools to test backend connectivity"
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