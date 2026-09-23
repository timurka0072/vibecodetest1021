@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   🚀 IP Manager - Запуск системы                         ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Проверяем наличие Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не установлен!
    echo 📥 Скачайте и установите Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js найден
node --version
echo.

REM Проверяем наличие базы данных
if not exist "server\ip_manager.db" (
    echo 📦 Инициализация базы данных...
    node server/init-db.js
    echo.
)

REM Запускаем сервер в фоне
echo 🔧 Запуск сервера базы данных...
start /B node server/server.js
echo.

REM Ждём 2 секунды пока сервер запустится
echo ⏳ Ожидание запуска сервера...
timeout /t 2 /nobreak >nul

REM Запускаем фронтенд
echo 🌐 Запуск веб-интерфейса...
echo.
echo ═══════════════════════════════════════════════════════════
echo   📍 Откройте браузер: http://localhost:5173
echo ═══════════════════════════════════════════════════════════
echo.
echo Для остановки нажмите Ctrl+C
echo.

REM Запускаем dev сервер
npm run dev
