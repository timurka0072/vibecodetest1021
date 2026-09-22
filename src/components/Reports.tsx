import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, List, Building2, Users, AlertTriangle, Download, CheckCircle } from 'lucide-react';
import { IPAssignment, DigitalSignature, Device, DeviceType, EmployeeAssignment, Employee } from '../types';
import { generateId } from '../store';
import EmployeeAutocomplete from './EmployeeAutocomplete';

interface Props {
  ipAssignments: IPAssignment[];
  signatures: DigitalSignature[];
  employees: Employee[];
  onUpdateIP: (assignments: IPAssignment[]) => void;
}

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  laptop: 'Ноутбук',
  desktop: 'ПК',
  printer: 'Принтер',
  mfp: 'МФУ',
  other: 'Другое',
};

export default function Reports({ ipAssignments, signatures, employees, onUpdateIP }: Props) {
  const [reportType, setReportType] = useState<'free-ips' | 'by-room' | 'by-employee' | 'expiring-sigs' | 'assign-ip'>('assign-ip');
  const [selectedFreeIP, setSelectedFreeIP] = useState<string>('');
  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    room: '',
    deviceType: 'laptop' as DeviceType,
    deviceName: '',
    inventoryNumber: '',
    macAddress: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [roomFilter, setRoomFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? emp.fullName : 'Неизвестный';
  };

  const freeIPs = ipAssignments.filter(
    (ip) => (ip.assignments?.length || 0) === 0 && (ip.devices?.length || 0) === 0
  );
  const rooms = [...new Set(ipAssignments.filter((ip) => ip.room).map((ip) => ip.room))].sort();
  const allEmployees = ipAssignments.flatMap(ip => (ip.assignments || []).map(a => a.employeeId));
  const employeeIds = [...new Set(allEmployees)].sort();

  const handleAssignIP = () => {
    if (!selectedFreeIP || !assignForm.employeeId) {
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

    const newAssignment: EmployeeAssignment = {
      id: generateId(),
      employeeId: assignForm.employeeId,
      assignedDate: assignForm.date,
    };

    const updated = ipAssignments.map((ip) => {
      if (ip.ipAddress === selectedFreeIP) {
        return {
          ...ip,
          room: assignForm.room || ip.room,
          devices: [...(ip.devices || []), newDevice],
          assignments: [...(ip.assignments || []), newAssignment],
        };
      }
      return ip;
    });

    onUpdateIP(updated);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setSelectedFreeIP('');
    setAssignForm({
      employeeId: '',
      room: '',
      deviceType: 'laptop',
      deviceName: '',
      inventoryNumber: '',
      macAddress: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const exportToCSV = (data: string[][], filename: string) => {
    const csv = data.map((row) => row.join(';')).join('\n');
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
    freeIPs.forEach((ip) => data.push([ip.ipAddress, ip.subnet || '']));
    exportToCSV(data, 'free_ips.csv');
  };

  const handleExportByRoom = () => {
    const filtered = roomFilter
      ? ipAssignments.filter((ip) => ip.room === roomFilter)
      : ipAssignments.filter((ip) => ip.room);
    const data = [['IP-адрес', 'Кабинет', 'Сотрудники', 'Устройства']];
    filtered.forEach((ip) => {
      const employeeNames = (ip.assignments || []).map(a => getEmployeeName(a.employeeId)).join(', ');
      const devices = (ip.devices || []).map((d) => d.name || DEVICE_TYPE_LABELS[d.type]).join(', ');
      data.push([ip.ipAddress, ip.room || '', employeeNames, devices]);
    });
    exportToCSV(data, `report_by_room${roomFilter ? '_' + roomFilter : ''}.csv`);
  };

  const handleExportByEmployee = () => {
    const data = [['IP-адрес', 'Сотрудник', 'Кабинет', 'Дата назначения', 'Устройства']];
    ipAssignments.forEach((ip) => {
      (ip.assignments || []).forEach(a => {
        if (employeeFilter === '' || a.employeeId === employeeFilter) {
          const devices = (ip.devices || []).map((d) => d.name || DEVICE_TYPE_LABELS[d.type]).join(', ');
          data.push([ip.ipAddress, getEmployeeName(a.employeeId), ip.room || '', a.assignedDate || '', devices]);
        }
      });
    });
    exportToCSV(data, `report_by_employee${employeeFilter ? '_' + getEmployeeName(employeeFilter) : ''}.csv`);
  };

  const handleExportExpiringSigs = () => {
    const expiring = signatures.filter((s) => s.status === 'expiring' || s.status === 'expired');
    const data = [['ФИО', 'УЦ', 'Серийный номер', 'Дата выдачи', 'Срок действия', 'Статус']];
    expiring.forEach((s) => {
      data.push([s.employeeName, s.issuer, s.serialNumber, s.issueDate, s.expiryDate, s.status === 'expired' ? 'Просрочена' : 'Истекает']);
    });
    exportToCSV(data, 'expiring_signatures.csv');
  };

  const reportTabs = [
    { key: 'assign-ip', label: 'Назначить IP', icon: <Target size={16} /> },
    { key: 'free-ips', label: 'Свободные IP', icon: <List size={16} /> },
    { key: 'by-room', label: 'По кабинетам', icon: <Building2 size={16} /> },
    { key: 'by-employee', label: 'По сотрудникам', icon: <Users size={16} /> },
    { key: 'expiring-sigs', label: 'Истекающие ЭЦП', icon: <AlertTriangle size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Отчёты и назначение</h2>
        <p className="text-sm text-gray-500">Аналитика, экспорт данных и назначение IP-адресов</p>
      </motion.div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle size={20} />
            <span className="font-medium">IP-адрес успешно назначен!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2">
        {reportTabs.map((tab) => (
          <motion.button
            key={tab.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setReportType(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              reportType === tab.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {reportType === 'assign-ip' && (
          <motion.div key="assign-ip" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Назначить свободный IP-адрес</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Выберите свободный IP</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  {freeIPs.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {freeIPs.map((ip) => (
                        <button
                          key={ip.id}
                          onClick={() => setSelectedFreeIP(ip.ipAddress)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedFreeIP === ip.ipAddress ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-mono">{ip.ipAddress}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">Нет свободных IP-адресов</div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Сотрудник *</label>
                  <EmployeeAutocomplete
                    employees={employees}
                    value={assignForm.employeeId}
                    onChange={(employeeId) => setAssignForm({ ...assignForm, employeeId })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Кабинет</label>
                  <input type="text" value={assignForm.room} onChange={(e) => setAssignForm({ ...assignForm, room: e.target.value })}
                    placeholder="134" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Тип устройства</label>
                    <select value={assignForm.deviceType} onChange={(e) => setAssignForm({ ...assignForm, deviceType: e.target.value as DeviceType })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                      <option value="laptop">Ноутбук</option>
                      <option value="desktop">ПК</option>
                      <option value="printer">Принтер</option>
                      <option value="mfp">МФУ</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Название</label>
                    <input type="text" value={assignForm.deviceName} onChange={(e) => setAssignForm({ ...assignForm, deviceName: e.target.value })}
                      placeholder="Модель" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAssignIP}
                  disabled={!selectedFreeIP || !assignForm.employeeId}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  Назначить IP-адрес
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {reportType === 'free-ips' && (
          <motion.div key="free-ips" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Свободные IP-адреса ({freeIPs.length})</h3>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExportFreeIPs}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2">
                <Download size={14} />Экспорт
              </motion.button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {freeIPs.map((ip) => (
                <div key={ip.id} className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-center">
                  <span className="font-mono text-sm text-green-800">{ip.ipAddress}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {reportType === 'by-room' && (
          <motion.div key="by-room" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">По кабинетам</h3>
              <div className="flex gap-2">
                <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">
                  <option value="">Все кабинеты</option>
                  {rooms.map((room) => (<option key={room} value={room}>Каб. {room}</option>))}
                </select>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExportByRoom}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2">
                  <Download size={14} />Экспорт
                </motion.button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">IP</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Кабинет</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Сотрудники</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Устройства</th>
                  </tr>
                </thead>
                <tbody>
                  {ipAssignments.filter((ip) => ip.room && (roomFilter === '' || ip.room === roomFilter))
                    .sort((a, b) => (a.room || '').localeCompare(b.room || ''))
                    .map((ip) => (
                      <tr key={ip.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-mono text-xs">{ip.ipAddress}</td>
                        <td className="py-2 px-3 text-sm">{ip.room}</td>
                        <td className="py-2 px-3 text-sm">{(ip.assignments || []).map(a => getEmployeeName(a.employeeId)).join(', ') || '—'}</td>
                        <td className="py-2 px-3 text-sm">{(ip.devices || []).map(d => d.name || DEVICE_TYPE_LABELS[d.type]).join(', ') || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {reportType === 'by-employee' && (
          <motion.div key="by-employee" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">По сотрудникам</h3>
              <div className="flex gap-2">
                <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">
                  <option value="">Все сотрудники</option>
                  {employeeIds.map((id) => (<option key={id} value={id}>{getEmployeeName(id)}</option>))}
                </select>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExportByEmployee}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2">
                  <Download size={14} />Экспорт
                </motion.button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Сотрудник</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">IP</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Кабинет</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Дата</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Устройства</th>
                  </tr>
                </thead>
                <tbody>
                  {ipAssignments.flatMap(ip => (ip.assignments || []).map(a => ({ ip, assignment: a })))
                    .filter(({ assignment }) => employeeFilter === '' || assignment.employeeId === employeeFilter)
                    .sort((a, b) => getEmployeeName(a.assignment.employeeId).localeCompare(getEmployeeName(b.assignment.employeeId)))
                    .map(({ ip, assignment }) => (
                      <tr key={`${ip.id}-${assignment.id}`} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-sm font-medium">{getEmployeeName(assignment.employeeId)}</td>
                        <td className="py-2 px-3 font-mono text-xs">{ip.ipAddress}</td>
                        <td className="py-2 px-3 text-sm">{ip.room || '—'}</td>
                        <td className="py-2 px-3 text-xs text-gray-500">{assignment.assignedDate || '—'}</td>
                        <td className="py-2 px-3 text-sm">{(ip.devices || []).map(d => d.name || DEVICE_TYPE_LABELS[d.type]).join(', ') || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {reportType === 'expiring-sigs' && (
          <motion.div key="expiring-sigs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Истекающие ЭЦП</h3>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExportExpiringSigs}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2">
                <Download size={14} />Экспорт
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">ФИО</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">УЦ</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Срок действия</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {signatures.filter((s) => s.status === 'expiring' || s.status === 'expired')
                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                    .map((sig) => (
                      <tr key={sig.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-sm font-medium">{sig.employeeName}</td>
                        <td className="py-2 px-3 text-sm">{sig.issuer}</td>
                        <td className="py-2 px-3 text-xs">{sig.expiryDate}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            sig.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {sig.status === 'expired' ? 'Просрочена' : 'Истекает'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
