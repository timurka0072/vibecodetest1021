import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  List,
  Building2,
  Users,
  AlertTriangle,
  Download,
  CheckCircle,
  Laptop,
  Monitor,
  Printer,
  Cpu,
  HardDrive,
} from 'lucide-react';
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

const DEVICE_ICONS: Record<DeviceType, React.ReactNode> = {
  laptop: <Laptop size={14} />,
  desktop: <Monitor size={14} />,
  printer: <Printer size={14} />,
  mfp: <Cpu size={14} />,
  other: <HardDrive size={14} />,
};

export default function Reports({ ipAssignments, signatures, onUpdateIP }: Props) {
  const [reportType, setReportType] = useState<'free-ips' | 'by-room' | 'by-employee' | 'expiring-sigs' | 'assign-ip'>('assign-ip');
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
  const [showSuccess, setShowSuccess] = useState(false);

  const freeIPs = ipAssignments.filter(
    (ip) => !ip.assignedTo && ip.devices.length === 0
  );
  const rooms = [
    ...new Set(ipAssignments.filter((ip) => ip.room).map((ip) => ip.room)),
  ].sort();
  const employees = [
    ...new Set(
      ipAssignments.filter((ip) => ip.assignedTo).map((ip) => ip.assignedTo!)
    ),
  ].sort();

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

    const updated = ipAssignments.map((ip) => {
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
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
    const csv = data.map((row) => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
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
    const data = [['IP-адрес', 'Кабинет', 'Сотрудник', 'Устройства']];
    filtered.forEach((ip) => {
      const devices = ip.devices
        .map((d) => `${d.name || DEVICE_TYPE_LABELS[d.type]}`)
        .join(', ');
      data.push([ip.ipAddress, ip.room || '', ip.assignedTo || '', devices]);
    });
    exportToCSV(data, `report_by_room${roomFilter ? '_' + roomFilter : ''}.csv`);
  };

  const handleExportByEmployee = () => {
    const filtered = employeeFilter
      ? ipAssignments.filter((ip) => ip.assignedTo === employeeFilter)
      : ipAssignments.filter((ip) => ip.assignedTo);
    const data = [
      ['IP-адрес', 'Сотрудник', 'Кабинет', 'Дата назначения', 'Устройства'],
    ];
    filtered.forEach((ip) => {
      const devices = ip.devices
        .map((d) => `${d.name || DEVICE_TYPE_LABELS[d.type]}`)
        .join(', ');
      data.push([
        ip.ipAddress,
        ip.assignedTo || '',
        ip.room || '',
        ip.assignedDate || '',
        devices,
      ]);
    });
    exportToCSV(
      data,
      `report_by_employee${employeeFilter ? '_' + employeeFilter : ''}.csv`
    );
  };

  const handleExportExpiringSigs = () => {
    const expiring = signatures.filter(
      (s) => s.status === 'expiring' || s.status === 'expired'
    );
    const data = [
      [
        'ФИО',
        'УЦ',
        'Серийный номер',
        'Дата выдачи',
        'Срок действия',
        'Статус',
      ],
    ];
    expiring.forEach((s) => {
      data.push([
        s.employeeName,
        s.issuer,
        s.serialNumber,
        s.issueDate,
        s.expiryDate,
        s.status === 'expired' ? 'Просрочена' : 'Истекает',
      ]);
    });
    exportToCSV(data, 'expiring_signatures.csv');
  };

  const reportTabs = [
    {
      key: 'assign-ip',
      label: 'Назначить IP',
      icon: <Target size={18} />,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      key: 'free-ips',
      label: 'Свободные IP',
      icon: <List size={18} />,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      key: 'by-room',
      label: 'По кабинетам',
      icon: <Building2 size={18} />,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      key: 'by-employee',
      label: 'По сотрудникам',
      icon: <Users size={18} />,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      key: 'expiring-sigs',
      label: 'Истекающие ЭЦП',
      icon: <AlertTriangle size={18} />,
      gradient: 'from-red-500 to-rose-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-1">
          Отчёты и назначение
        </h2>
        <p className="text-gray-500">
          Аналитика, экспорт данных и назначение IP-адресов
        </p>
      </motion.div>

      {/* Success notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-20 right-6 z-50 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <CheckCircle size={20} />
            </motion.div>
            <span className="font-medium">IP-адрес успешно назначен!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Type Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {reportTabs.map((tab, index) => (
          <motion.button
            key={tab.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setReportType(tab.key as any)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              reportType === tab.key
                ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:shadow-md'
            }`}
          >
            {tab.icon}
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Assign IP Report */}
      <AnimatePresence mode="wait">
        {reportType === 'assign-ip' && (
          <motion.div
            key="assign-ip"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Назначить свободный IP-адрес
                </h3>
                <p className="text-sm text-gray-500">
                  Выберите адрес и заполните данные сотрудника
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Select free IP */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Выберите свободный IP
                </label>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-gray-50">
                  {freeIPs.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {freeIPs.map((ip, index) => (
                        <motion.button
                          key={ip.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          whileHover={{ x: 4 }}
                          onClick={() => setSelectedFreeIP(ip.ipAddress)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-all ${
                            selectedFreeIP === ip.ipAddress
                              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-800 font-semibold border-l-4 border-indigo-500'
                              : 'text-gray-700 hover:bg-white'
                          }`}
                        >
                          <span className="font-mono font-semibold">
                            {ip.ipAddress}
                          </span>
                          <span className="text-gray-400 ml-2 text-xs">
                            {ip.subnet}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      <List size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Нет свободных IP-адресов</p>
                    </div>
                  )}
                </div>
                {selectedFreeIP && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
                  >
                    <p className="text-sm font-semibold text-indigo-700">
                      ✓ Выбран: {selectedFreeIP}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Right: Assignment form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Сотрудник (ФИО) *
                  </label>
                  <input
                    type="text"
                    value={assignForm.employee}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, employee: e.target.value })
                    }
                    placeholder="Иванов Иван Иванович"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Кабинет
                  </label>
                  <input
                    type="text"
                    value={assignForm.room}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, room: e.target.value })
                    }
                    placeholder="134"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Тип устройства
                    </label>
                    <select
                      value={assignForm.deviceType}
                      onChange={(e) =>
                        setAssignForm({
                          ...assignForm,
                          deviceType: e.target.value as DeviceType,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                    >
                      <option value="laptop">Ноутбук</option>
                      <option value="desktop">ПК</option>
                      <option value="printer">Принтер</option>
                      <option value="mfp">МФУ</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Название/модель
                    </label>
                    <input
                      type="text"
                      value={assignForm.deviceName}
                      onChange={(e) =>
                        setAssignForm({
                          ...assignForm,
                          deviceName: e.target.value,
                        })
                      }
                      placeholder="ThinkPad T490"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Инв. номер
                    </label>
                    <input
                      type="text"
                      value={assignForm.inventoryNumber}
                      onChange={(e) =>
                        setAssignForm({
                          ...assignForm,
                          inventoryNumber: e.target.value,
                        })
                      }
                      placeholder="ИНВ-00001"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      MAC-адрес
                    </label>
                    <input
                      type="text"
                      value={assignForm.macAddress}
                      onChange={(e) =>
                        setAssignForm({
                          ...assignForm,
                          macAddress: e.target.value,
                        })
                      }
                      placeholder="AA:BB:CC:DD:EE:FF"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Дата назначения
                  </label>
                  <input
                    type="date"
                    value={assignForm.date}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, date: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAssignIP}
                  disabled={!selectedFreeIP || !assignForm.employee}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  <CheckCircle size={18} />
                  Назначить IP-адрес
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Free IPs Report */}
        {reportType === 'free-ips' && (
          <motion.div
            key="free-ips"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6"
          >
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <List size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Свободные IP-адреса
                  </h3>
                  <p className="text-sm text-gray-500">
                    {freeIPs.length} адресов доступно
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportFreeIPs}
                className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-md transition-all text-sm font-medium flex items-center gap-2"
              >
                <Download size={16} />
                Экспорт CSV
              </motion.button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {freeIPs.map((ip, index) => (
                <motion.div
                  key={ip.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.1, y: -4 }}
                  className="px-3 py-2 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl text-center shadow-sm cursor-default"
                >
                  <span className="font-mono text-sm font-semibold text-emerald-800">
                    {ip.ipAddress}
                  </span>
                </motion.div>
              ))}
            </div>
            {freeIPs.length === 0 && (
              <div className="text-center py-12">
                <List size={48} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 font-medium">
                  Нет свободных IP-адресов
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* By Room Report */}
        {reportType === 'by-room' && (
          <motion.div
            key="by-room"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6"
          >
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    IP-адреса по кабинетам
                  </h3>
                  <p className="text-sm text-gray-500">
                    Распределение по помещениям
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 input-animated"
                >
                  <option value="">Все кабинеты</option>
                  {rooms.map((room) => (
                    <option key={room} value={room}>
                      Каб. {room}
                    </option>
                  ))}
                </select>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportByRoom}
                  className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-md transition-all text-sm font-medium flex items-center gap-2"
                >
                  <Download size={16} />
                  Экспорт
                </motion.button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      IP-адрес
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      Кабинет
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      Сотрудник
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      Устройства
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ipAssignments
                    .filter(
                      (ip) =>
                        ip.room && (roomFilter === '' || ip.room === roomFilter)
                    )
                    .sort((a, b) =>
                      (a.room || '').localeCompare(b.room || '')
                    )
                    .map((ip, index) => (
                      <motion.tr
                        key={ip.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-gray-100/50 table-row-hover"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg text-xs">
                            {ip.ipAddress}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">
                            {ip.room}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {ip.assignedTo || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {ip.devices.map((d) => (
                              <span
                                key={d.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100"
                              >
                                {DEVICE_ICONS[d.type]}
                                {d.name || DEVICE_TYPE_LABELS[d.type]}
                              </span>
                            ))}
                            {ip.devices.length === 0 && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* By Employee Report */}
        {reportType === 'by-employee' && (
          <motion.div
            key="by-employee"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6"
          >
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    IP-адреса по сотрудникам
                  </h3>
                  <p className="text-sm text-gray-500">
                    Закреплённые адреса
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 input-animated"
                >
                  <option value="">Все сотрудники</option>
                  {employees.map((emp) => (
                    <option key={emp} value={emp}>
                      {emp}
                    </option>
                  ))}
                </select>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportByEmployee}
                  className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-md transition-all text-sm font-medium flex items-center gap-2"
                >
                  <Download size={16} />
                  Экспорт
                </motion.button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      Сотрудник
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      IP-адрес
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      Кабинет
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      Устройства
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ipAssignments
                    .filter(
                      (ip) =>
                        ip.assignedTo &&
                        (employeeFilter === '' ||
                          ip.assignedTo === employeeFilter)
                    )
                    .sort((a, b) =>
                      (a.assignedTo || '').localeCompare(b.assignedTo || '')
                    )
                    .map((ip, index) => (
                      <motion.tr
                        key={ip.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-gray-100/50 table-row-hover"
                      >
                        <td className="py-3 px-4 font-semibold text-gray-800">
                          {ip.assignedTo}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg text-xs">
                            {ip.ipAddress}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {ip.room ? (
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">
                              {ip.room}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {ip.assignedDate || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {ip.devices.map((d) => (
                              <span
                                key={d.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100"
                              >
                                {DEVICE_ICONS[d.type]}
                                {d.name || DEVICE_TYPE_LABELS[d.type]}
                              </span>
                            ))}
                            {ip.devices.length === 0 && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Expiring Signatures Report */}
        {reportType === 'expiring-sigs' && (
          <motion.div
            key="expiring-sigs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6"
          >
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Истекающие и просроченные ЭЦП
                  </h3>
                  <p className="text-sm text-gray-500">
                    Требуют внимания
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportExpiringSigs}
                className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-md transition-all text-sm font-medium flex items-center gap-2"
              >
                <Download size={16} />
                Экспорт CSV
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      ФИО
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      УЦ
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      Серийный номер
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      Срок действия
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {signatures
                    .filter(
                      (s) => s.status === 'expiring' || s.status === 'expired'
                    )
                    .sort(
                      (a, b) =>
                        new Date(a.expiryDate).getTime() -
                        new Date(b.expiryDate).getTime()
                    )
                    .map((sig, index) => (
                      <motion.tr
                        key={sig.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-gray-100/50 table-row-hover"
                      >
                        <td className="py-3 px-4 font-semibold text-gray-800">
                          {sig.employeeName}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {sig.issuer}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                            {sig.serialNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {sig.expiryDate}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              sig.status === 'expired'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {sig.status === 'expired' ? (
                              <AlertTriangle size={12} />
                            ) : (
                              <AlertTriangle size={12} />
                            )}
                            {sig.status === 'expired'
                              ? 'Просрочена'
                              : 'Истекает'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  {signatures.filter(
                    (s) => s.status === 'expiring' || s.status === 'expired'
                  ).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <CheckCircle
                          size={48}
                          className="mx-auto text-emerald-200 mb-3"
                        />
                        <p className="font-medium text-emerald-600">
                          Всё в порядке!
                        </p>
                        <p className="text-xs mt-1">
                          Нет истекающих или просроченных ЭЦП
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
