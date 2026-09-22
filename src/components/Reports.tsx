import React, { useState } from 'react';
import { IPAssignment, DigitalSignature, Device, DeviceType } from '../types';
import { generateId } from '../store';

interface Props {
  ipAssignments: IPAssignment[];
  signatures: DigitalSignature[];
  onUpdateIP: (assignments: IPAssignment[]) => void;
}

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  laptop: 'Ноутбук',
  desktop: 'ПК',
  printer: 'Принтер',
  mfp: 'МФУ',
  other: 'Другое',
};

export default function Reports({ ipAssignments, signatures, onUpdateIP }: Props) {
  const [reportType, setReportType] = useState<'free-ips' | 'by-room' | 'by-employee' | 'expiring-sigs' | 'assign-ip'>('free-ips');
  const [selectedFreeIP, setSelectedFreeIP] = useState<string>('');
  const [assignForm, setAssignForm] = useState({
    employee: '',
    room: '',
    deviceType: 'laptop' as DeviceType,
    deviceName: '',
    inventoryNumber: '',
    macAddress: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [roomFilter, setRoomFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  const freeIPs = ipAssignments.filter(ip => !ip.assignedTo && ip.devices.length === 0);
  const rooms = [...new Set(ipAssignments.filter(ip => ip.room).map(ip => ip.room))].sort();
  const employees = [...new Set(ipAssignments.filter(ip => ip.assignedTo).map(ip => ip.assignedTo!))].sort();

  const handleAssignIP = () => {
    if (!selectedFreeIP || !assignForm.employee) {
      alert('Выберите IP-адрес и укажите сотрудника');
      return;
    }

    const newDevice: Device = {
      id: generateId(),
      type: assignForm.deviceType,
      name: assignForm.deviceName,
      inventoryNumber: assignForm.inventoryNumber || undefined,
      macAddress: assignForm.macAddress || undefined,
    };

    const updated = ipAssignments.map(ip => {
      if (ip.ipAddress === selectedFreeIP) {
        return {
          ...ip,
          assignedTo: assignForm.employee,
          room: assignForm.room || undefined,
          assignedDate: assignForm.date,
          devices: [newDevice],
        };
      }
      return ip;
    });

    onUpdateIP(updated);
    alert(`IP-адрес ${selectedFreeIP} назначен сотруднику ${assignForm.employee}`);
    setSelectedFreeIP('');
    setAssignForm({
      employee: '',
      room: '',
      deviceType: 'laptop',
      deviceName: '',
      inventoryNumber: '',
      macAddress: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const exportToCSV = (data: string[][], filename: string) => {
    const csv = data.map(row => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFreeIPs = () => {
    const data = [['IP-адрес', 'Подсеть']];
    freeIPs.forEach(ip => data.push([ip.ipAddress, ip.subnet || '']));
    exportToCSV(data, 'free_ips.csv');
  };

  const handleExportByRoom = () => {
    const filtered = roomFilter ? ipAssignments.filter(ip => ip.room === roomFilter) : ipAssignments.filter(ip => ip.room);
    const data = [['IP-адрес', 'Кабинет', 'Сотрудник', 'Устройства']];
    filtered.forEach(ip => {
      const devices = ip.devices.map(d => `${d.name || DEVICE_TYPE_LABELS[d.type]}`).join(', ');
      data.push([ip.ipAddress, ip.room || '', ip.assignedTo || '', devices]);
    });
    exportToCSV(data, `report_by_room${roomFilter ? '_' + roomFilter : ''}.csv`);
  };

  const handleExportByEmployee = () => {
    const filtered = employeeFilter ? ipAssignments.filter(ip => ip.assignedTo === employeeFilter) : ipAssignments.filter(ip => ip.assignedTo);
    const data = [['IP-адрес', 'Сотрудник', 'Кабинет', 'Дата назначения', 'Устройства']];
    filtered.forEach(ip => {
      const devices = ip.devices.map(d => `${d.name || DEVICE_TYPE_LABELS[d.type]}`).join(', ');
      data.push([ip.ipAddress, ip.assignedTo || '', ip.room || '', ip.assignedDate || '', devices]);
    });
    exportToCSV(data, `report_by_employee${employeeFilter ? '_' + employeeFilter : ''}.csv`);
  };

  const handleExportExpiringSigs = () => {
    const expiring = signatures.filter(s => s.status === 'expiring' || s.status === 'expired');
    const data = [['ФИО', 'УЦ', 'Серийный номер', 'Дата выдачи', 'Срок действия', 'Статус']];
    expiring.forEach(s => {
      data.push([s.employeeName, s.issuer, s.serialNumber, s.issueDate, s.expiryDate, s.status === 'expired' ? 'Просрочена' : 'Истекает']);
    });
    exportToCSV(data, 'expiring_signatures.csv');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Отчёты и назначение</h2>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'assign-ip', label: '🎯 Назначить IP', icon: '' },
          { key: 'free-ips', label: '📋 Свободные IP', icon: '' },
          { key: 'by-room', label: '🏢 По кабинетам', icon: '' },
          { key: 'by-employee', label: '👤 По сотрудникам', icon: '' },
          { key: 'expiring-sigs', label: '⚠️ Истекающие ЭЦП', icon: '' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setReportType(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              reportType === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assign IP Report */}
      {reportType === 'assign-ip' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Назначить свободный IP-адрес</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Select free IP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Выберите свободный IP</label>
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                {freeIPs.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {freeIPs.map(ip => (
                      <button
                        key={ip.id}
                        onClick={() => setSelectedFreeIP(ip.ipAddress)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition ${
                          selectedFreeIP === ip.ipAddress ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span className="font-mono">{ip.ipAddress}</span>
                        <span className="text-gray-400 ml-2 text-xs">{ip.subnet}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">Нет свободных IP-адресов</div>
                )}
              </div>
              {selectedFreeIP && (
                <p className="mt-2 text-sm text-blue-600 font-medium">
                  Выбран: {selectedFreeIP}
                </p>
              )}
            </div>

            {/* Right: Assignment form */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник (ФИО) *</label>
                <input
                  type="text"
                  value={assignForm.employee}
                  onChange={(e) => setAssignForm({ ...assignForm, employee: e.target.value })}
                  placeholder="Иванов Иван Иванович"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Кабинет</label>
                <input
                  type="text"
                  value={assignForm.room}
                  onChange={(e) => setAssignForm({ ...assignForm, room: e.target.value })}
                  placeholder="134"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип устройства</label>
                  <select
                    value={assignForm.deviceType}
                    onChange={(e) => setAssignForm({ ...assignForm, deviceType: e.target.value as DeviceType })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="laptop">Ноутбук</option>
                    <option value="desktop">ПК</option>
                    <option value="printer">Принтер</option>
                    <option value="mfp">МФУ</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название/модель</label>
                  <input
                    type="text"
                    value={assignForm.deviceName}
                    onChange={(e) => setAssignForm({ ...assignForm, deviceName: e.target.value })}
                    placeholder="ThinkPad T490"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Инв. номер</label>
                  <input
                    type="text"
                    value={assignForm.inventoryNumber}
                    onChange={(e) => setAssignForm({ ...assignForm, inventoryNumber: e.target.value })}
                    placeholder="ИНВ-00001"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MAC-адрес</label>
                  <input
                    type="text"
                    value={assignForm.macAddress}
                    onChange={(e) => setAssignForm({ ...assignForm, macAddress: e.target.value })}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата назначения</label>
                <input
                  type="date"
                  value={assignForm.date}
                  onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleAssignIP}
                disabled={!selectedFreeIP || !assignForm.employee}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Назначить IP-адрес
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free IPs Report */}
      {reportType === 'free-ips' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Свободные IP-адреса ({freeIPs.length})
            </h3>
            <button
              onClick={handleExportFreeIPs}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              📥 Экспорт CSV
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {freeIPs.map(ip => (
              <div key={ip.id} className="px-2 py-1.5 bg-green-50 border border-green-100 rounded text-center">
                <span className="font-mono text-sm text-green-800">{ip.ipAddress}</span>
              </div>
            ))}
          </div>
          {freeIPs.length === 0 && (
            <p className="text-center text-gray-400 py-8">Нет свободных IP-адресов</p>
          )}
        </div>
      )}

      {/* By Room Report */}
      {reportType === 'by-room' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h3 className="text-lg font-semibold text-gray-700">IP-адреса по кабинетам</h3>
            <div className="flex gap-2">
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все кабинеты</option>
                {rooms.map(room => (
                  <option key={room} value={room}>Каб. {room}</option>
                ))}
              </select>
              <button
                onClick={handleExportByRoom}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                📥 Экспорт CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">IP-адрес</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Кабинет</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Сотрудник</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Устройства</th>
                </tr>
              </thead>
              <tbody>
                {ipAssignments
                  .filter(ip => ip.room && (roomFilter === '' || ip.room === roomFilter))
                  .sort((a, b) => (a.room || '').localeCompare(b.room || ''))
                  .map(ip => (
                    <tr key={ip.id} className="border-b border-gray-50">
                      <td className="py-2 px-3 font-mono">{ip.ipAddress}</td>
                      <td className="py-2 px-3">{ip.room}</td>
                      <td className="py-2 px-3">{ip.assignedTo || '—'}</td>
                      <td className="py-2 px-3">
                        {ip.devices.map(d => d.name || DEVICE_TYPE_LABELS[d.type]).join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Employee Report */}
      {reportType === 'by-employee' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h3 className="text-lg font-semibold text-gray-700">IP-адреса по сотрудникам</h3>
            <div className="flex gap-2">
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все сотрудники</option>
                {employees.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
              <button
                onClick={handleExportByEmployee}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                📥 Экспорт CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Сотрудник</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">IP-адрес</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Кабинет</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Дата назначения</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Устройства</th>
                </tr>
              </thead>
              <tbody>
                {ipAssignments
                  .filter(ip => ip.assignedTo && (employeeFilter === '' || ip.assignedTo === employeeFilter))
                  .sort((a, b) => (a.assignedTo || '').localeCompare(b.assignedTo || ''))
                  .map(ip => (
                    <tr key={ip.id} className="border-b border-gray-50">
                      <td className="py-2 px-3 font-medium">{ip.assignedTo}</td>
                      <td className="py-2 px-3 font-mono">{ip.ipAddress}</td>
                      <td className="py-2 px-3">{ip.room || '—'}</td>
                      <td className="py-2 px-3 text-gray-500">{ip.assignedDate || '—'}</td>
                      <td className="py-2 px-3">
                        {ip.devices.map(d => d.name || DEVICE_TYPE_LABELS[d.type]).join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expiring Signatures Report */}
      {reportType === 'expiring-sigs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Истекающие и просроченные ЭЦП</h3>
            <button
              onClick={handleExportExpiringSigs}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              📥 Экспорт CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">ФИО</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">УЦ</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Серийный номер</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Срок действия</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Статус</th>
                </tr>
              </thead>
              <tbody>
                {signatures
                  .filter(s => s.status === 'expiring' || s.status === 'expired')
                  .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                  .map(sig => (
                    <tr key={sig.id} className="border-b border-gray-50">
                      <td className="py-2 px-3 font-medium">{sig.employeeName}</td>
                      <td className="py-2 px-3">{sig.issuer}</td>
                      <td className="py-2 px-3 font-mono text-xs">{sig.serialNumber}</td>
                      <td className="py-2 px-3">{sig.expiryDate}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sig.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {sig.status === 'expired' ? 'Просрочена' : 'Истекает'}
                        </span>
                      </td>
                    </tr>
                  ))}
                {signatures.filter(s => s.status === 'expiring' || s.status === 'expired').length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Нет истекающих или просроченных ЭЦП
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
