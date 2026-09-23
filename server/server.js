const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Инициализация базы данных
initDatabase();

// ==================== NETWORKS ====================

// Получить все сети
app.get('/api/networks', (req, res) => {
  try {
    const networks = db.prepare('SELECT * FROM networks').all();
    res.json(networks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать сеть
app.post('/api/networks', (req, res) => {
  try {
    const { id, name, networkAddress, subnetMask, startIP, endIP } = req.body;
    db.prepare(`
      INSERT INTO networks (id, name, network_address, subnet_mask, start_ip, end_ip)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, networkAddress, subnetMask, startIP, endIP);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить сеть
app.put('/api/networks/:id', (req, res) => {
  try {
    const { name, networkAddress, subnetMask, startIP, endIP } = req.body;
    db.prepare(`
      UPDATE networks 
      SET name = ?, network_address = ?, subnet_mask = ?, start_ip = ?, end_ip = ?
      WHERE id = ?
    `).run(name, networkAddress, subnetMask, startIP, endIP, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить сеть
app.delete('/api/networks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM networks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EMPLOYEES ====================

// Получить всех сотрудников
app.get('/api/employees', (req, res) => {
  try {
    const employees = db.prepare('SELECT * FROM employees').all();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать сотрудника
app.post('/api/employees', (req, res) => {
  try {
    const { id, fullName, position, department, email, phone } = req.body;
    db.prepare(`
      INSERT INTO employees (id, full_name, position, department, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, fullName, position || null, department || null, email || null, phone || null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить сотрудника
app.put('/api/employees/:id', (req, res) => {
  try {
    const { fullName, position, department, email, phone } = req.body;
    db.prepare(`
      UPDATE employees 
      SET full_name = ?, position = ?, department = ?, email = ?, phone = ?
      WHERE id = ?
    `).run(fullName, position || null, department || null, email || null, phone || null, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить сотрудника
app.delete('/api/employees/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== IP ASSIGNMENTS ====================

// Получить все IP адреса с назначениями и устройствами
app.get('/api/ip-assignments', (req, res) => {
  try {
    const ipAssignments = db.prepare('SELECT * FROM ip_assignments').all();
    
    // Для каждого IP получаем назначения и устройства
    const result = ipAssignments.map(ip => {
      const assignments = db.prepare(`
        SELECT ea.*, e.full_name as employee_name
        FROM employee_assignments ea
        LEFT JOIN employees e ON ea.employee_id = e.id
        WHERE ea.ip_id = ?
      `).all(ip.id);

      const devices = db.prepare('SELECT * FROM devices WHERE ip_id = ?').all(ip.id);

      return {
        id: ip.id,
        ipAddress: ip.ip_address,
        subnet: ip.subnet,
        room: ip.room,
        networkId: ip.network_id,
        notes: ip.notes,
        assignments: assignments.map(a => ({
          id: a.id,
          employeeId: a.employee_id,
          employeeName: a.employee_name,
          assignedDate: a.assigned_date
        })),
        devices: devices.map(d => ({
          id: d.id,
          type: d.type,
          name: d.name,
          inventoryNumber: d.inventory_number,
          macAddress: d.mac_address
        }))
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать IP адрес
app.post('/api/ip-assignments', (req, res) => {
  try {
    const { id, ipAddress, subnet, room, networkId, notes, assignments, devices } = req.body;
    
    db.prepare(`
      INSERT INTO ip_assignments (id, ip_address, subnet, room, network_id, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, ipAddress, subnet || null, room || null, networkId || null, notes || null);

    // Добавляем назначения
    if (assignments && assignments.length > 0) {
      const insertAssignment = db.prepare(`
        INSERT INTO employee_assignments (id, ip_id, employee_id, assigned_date)
        VALUES (?, ?, ?, ?)
      `);
      assignments.forEach(a => {
        insertAssignment.run(a.id, id, a.employeeId, a.assignedDate);
      });
    }

    // Добавляем устройства
    if (devices && devices.length > 0) {
      const insertDevice = db.prepare(`
        INSERT INTO devices (id, ip_id, type, name, inventory_number, mac_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      devices.forEach(d => {
        insertDevice.run(d.id, id, d.type, d.name || null, d.inventoryNumber || null, d.macAddress || null);
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить IP адрес
app.put('/api/ip-assignments/:id', (req, res) => {
  try {
    const { room, notes, assignments, devices } = req.body;
    
    // Обновляем основную запись
    db.prepare(`
      UPDATE ip_assignments 
      SET room = ?, notes = ?
      WHERE id = ?
    `).run(room || null, notes || null, req.params.id);

    // Удаляем старые назначения и добавляем новые
    db.prepare('DELETE FROM employee_assignments WHERE ip_id = ?').run(req.params.id);
    if (assignments && assignments.length > 0) {
      const insertAssignment = db.prepare(`
        INSERT INTO employee_assignments (id, ip_id, employee_id, assigned_date)
        VALUES (?, ?, ?, ?)
      `);
      assignments.forEach(a => {
        insertAssignment.run(a.id, req.params.id, a.employeeId, a.assignedDate);
      });
    }

    // Удаляем старые устройства и добавляем новые
    db.prepare('DELETE FROM devices WHERE ip_id = ?').run(req.params.id);
    if (devices && devices.length > 0) {
      const insertDevice = db.prepare(`
        INSERT INTO devices (id, ip_id, type, name, inventory_number, mac_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      devices.forEach(d => {
        insertDevice.run(d.id, req.params.id, d.type, d.name || null, d.inventoryNumber || null, d.macAddress || null);
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить IP адрес
app.delete('/api/ip-assignments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM ip_assignments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DIGITAL SIGNATURES ====================

// Получить все подписи
app.get('/api/signatures', (req, res) => {
  try {
    const signatures = db.prepare('SELECT * FROM digital_signatures').all();
    res.json(signatures.map(s => ({
      id: s.id,
      employeeId: s.employee_id,
      employeeName: s.employee_name,
      issuer: s.issuer,
      serialNumber: s.serial_number,
      issueDate: s.issue_date,
      expiryDate: s.expiry_date,
      status: s.status
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать подпись
app.post('/api/signatures', (req, res) => {
  try {
    const { id, employeeId, employeeName, issuer, serialNumber, issueDate, expiryDate, status } = req.body;
    db.prepare(`
      INSERT INTO digital_signatures (id, employee_id, employee_name, issuer, serial_number, issue_date, expiry_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, employeeId || null, employeeName, issuer, serialNumber, issueDate, expiryDate, status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить подпись
app.put('/api/signatures/:id', (req, res) => {
  try {
    const { employeeId, employeeName, issuer, serialNumber, issueDate, expiryDate, status } = req.body;
    db.prepare(`
      UPDATE digital_signatures 
      SET employee_id = ?, employee_name = ?, issuer = ?, serial_number = ?, issue_date = ?, expiry_date = ?, status = ?
      WHERE id = ?
    `).run(employeeId || null, employeeName, issuer, serialNumber, issueDate, expiryDate, status, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить подпись
app.delete('/api/signatures/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM digital_signatures WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'IP Manager API is running' });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 IP Manager API Server                                ║
║                                                           ║
║   Server running on:                                      ║
║   • Local:   http://localhost:${PORT}                        ║
║   • Network: http://<YOUR_IP>:${PORT}                        ║
║                                                           ║
║   Database: SQLite (ip_manager.db)                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
