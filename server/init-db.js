const { db, initDatabase } = require('./database');

// Инициализация базы данных
initDatabase();

// Добавляем сеть по умолчанию
const defaultNetwork = {
  id: 'default',
  name: 'Основная сеть',
  networkAddress: '192.168.1.0',
  subnetMask: '24',
  startIP: 1,
  endIP: 254
};

try {
  db.prepare(`
    INSERT OR IGNORE INTO networks (id, name, network_address, subnet_mask, start_ip, end_ip)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    defaultNetwork.id,
    defaultNetwork.name,
    defaultNetwork.networkAddress,
    defaultNetwork.subnetMask,
    defaultNetwork.startIP,
    defaultNetwork.endIP
  );

  // Генерируем IP адреса для сети
  const [a, b, c] = defaultNetwork.networkAddress.split('.').map(Number);
  const insertIP = db.prepare(`
    INSERT OR IGNORE INTO ip_assignments (id, ip_address, subnet, network_id)
    VALUES (?, ?, ?, ?)
  `);

  for (let i = defaultNetwork.startIP; i <= defaultNetwork.endIP; i++) {
    insertIP.run(
      `${defaultNetwork.id}-${i}`,
      `${a}.${b}.${c}.${i}`,
      `${defaultNetwork.networkAddress}/${defaultNetwork.subnetMask}`,
      defaultNetwork.id
    );
  }

  console.log('✅ База данных инициализирована с данными по умолчанию');
  console.log(`   - Создана сеть: ${defaultNetwork.name}`);
  console.log(`   - Сгенерировано IP адресов: ${defaultNetwork.endIP - defaultNetwork.startIP + 1}`);
} catch (error) {
  console.error('❌ Ошибка инициализации:', error.message);
}

process.exit(0);
