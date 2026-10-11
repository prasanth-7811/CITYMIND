$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; python -m uvicorn backend.main:app --reload --port 8000" -WindowStyle Normal

Start-Sleep 3

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; node index.js" -WindowStyle Normal

Start-Sleep 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev" -WindowStyle Normal

Start-Sleep 5

Start-Process "http://localhost:5173"

Write-Host "All servers started:" -ForegroundColor Green
Write-Host "  FastAPI  -> http://localhost:8000"
Write-Host "  Node.js  -> http://localhost:3001"
Write-Host "  Frontend -> http://localhost:5173"
