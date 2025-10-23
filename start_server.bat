if (!isRunning) return;@echo off
echo ========================================
echo 🚀 Champion Bot Web - Servidor Local
echo ========================================
echo.
echo Iniciando servidor HTTP na porta 8000...
echo Acesse: http://localhost:8000/auth.html
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

python -m http.server 8000
