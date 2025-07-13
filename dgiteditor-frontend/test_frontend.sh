#!/bin/bash

echo "📦 Ensuring Playwright browsers are installed..."

echo "🚀 Starting frontend in background..."
PORT=3000
npx next dev -p $PORT & NEXT_PID=$!

# Wait for frontend to boot (adjust if needed)
sleep 5

echo "🧪 Running Playwright tests..."
npx playwright test

echo "🧼 Frontend stopped."
kill $NEXT_PID
