const Database = require('better-sqlite3');
const path = require('path');

// Создаем подключение к базе данных
const db = new Database(path.join(__dirname, 'ip_manager.db'));

// Включаем WAL режим для лучшей производительности
db.pragma('journal_mode = WAL');

// Создаем таблицы
function initDatabase() {
  // Таблица сетей
  db.exec(`
    CREATE TABLE IF NOT EXISTS networks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      network_address TEXT NOT NULL,
      subnet_mask TEXT NOT NULL,
      start_ip INTEGER NOT NULL,
      end_ip INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица сотрудников
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      position TEXT,
      department TEXT,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица IP адресов
  db.exec(`
    CREATE TABLE IF NOT EXISTS ip_assignments (
      id TEXT PRIMARY KEY,
      ip_address TEXT NOT NULL UNIQUE,
      subnet TEXT,
      room TEXT,
      network_id TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (network_id) REFERENCES networks(id)
    )
  `);

  // Таблица назначений сотрудников на IP
  db.exec(`
    CREATE TABLE IF NOT EXISTS employee_assignments (
      id TEXT PRIMARY KEY,
      ip_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      assigned_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ip_id) REFERENCES ip_assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `);

  // Таблица устройств
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      ip_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT,
      inventory_number TEXT,
      mac_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ip_id) REFERENCES ip_assignments(id) ON DELETE CASCADE
    )
  `);

  // Таблица электронных подписей
  db.exec(`
    CREATE TABLE IF NOT EXISTS digital_signatures (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      serial_number TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `);

  console.log('✅ База данных инициализирована');
}

module.exports = { db, initDatabase };
