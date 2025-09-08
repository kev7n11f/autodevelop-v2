# AutoDevelop.ai Development Startup Script
# This script starts both the backend and frontend servers for development

Write-Host "🚀 Starting AutoDevelop.ai Development Environment..." -ForegroundColor Green

# Check if node_modules exist in backend
if (!(Test-Path "backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Check if node_modules exist in frontend  
if (!(Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host "Starting backend server on port 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; node server.js"

Start-Sleep -Seconds 3

Write-Host "Starting frontend development server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "✅ Development servers started!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 The chat function is now properly connected to OpenAI!" -ForegroundColor Yellow
Write-Host "🎯 You can test the chat at http://localhost:5173" -ForegroundColor Yellow
