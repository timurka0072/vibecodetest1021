#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🚀 IP Manager - Запуск системы                         ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    echo "📥 Скачайте и установите Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js найден: $(node --version)"
echo ""

# Проверяем наличие базы данных
if [ ! -f "server/ip_manager.db" ]; then
    echo "📦 Инициализация базы данных..."
    node server/init-db.js
    echo ""
fi

# Запускаем сервер в фоне
echo "🔧 Запуск сервера базы данных..."
node server/server.js &
SERVER_PID=$!
echo "   PID сервера: $SERVER_PID"
echo ""

# Ждём 2 секунды пока сервер запустится
echo "⏳ Ожидание запуска сервера..."
sleep 2

# Запускаем фронтенд
echo "🌐 Запуск веб-интерфейса..."
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📍 Откройте браузер: http://localhost:5173"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

# Запускаем dev сервер
npm run dev

# Останавливаем сервер при завершении
kill $SERVER_PID 2>/dev/null
echo ""
echo "👋 Сервер остановлен"
