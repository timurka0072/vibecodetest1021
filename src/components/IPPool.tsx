import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Edit3,
  Trash2,
  Plus,
  X,
  Save,
  Laptop,
  Monitor,
  Printer,
  Cpu,
  HardDrive,
  Users,
} from 'lucide-react';
import { IPAssignment, Device, DeviceType, EmployeeAssignment, Employee } from '../types';
import { generateId } from '../store';
import EmployeeAutocomplete from './EmployeeAutocomplete';

interface Props {
  ipAssignments: IPAssignment[];
  employees: Employee[];
  onUpdate: (assignments: IPAssignment[]) => void;
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

export default function IPPool({ ipAssignments, employees, onUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'free' | 'used'>('all');
  const [editingIP, setEditingIP] = useState<IPAssignment | null>(null);
  const [showModal, setShowModal] = useState(false);

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? emp.fullName : 'Неизвестный';
  };

  const filteredIPs = ipAssignments.filter((ip) => {
    const matchesSearch =
      ip.ipAddress.includes(search) ||
      (ip.assignments?.some(a => {
        const name = getEmployeeName(a.employeeId);
        return name.toLowerCase().includes(search.toLowerCase());
      }) || false) ||
      (ip.room && ip.room.includes(search));

    const isUsed = (ip.assignments?.length || 0) > 0 || (ip.devices?.length || 0) > 0;
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'free' && !isUsed) ||
      (filterStatus === 'used' && isUsed);

    return matchesSearch && matchesFilter;
  });

  const handleEdit = (ip: IPAssignment) => {
    setEditingIP({ 
      ...ip, 
      devices: [...(ip.devices || [])],
      assignments: (ip.assignments || []).map(a => ({ ...a }))
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingIP) return;
    const updated = ipAssignments.map((ip) =>
      ip.id === editingIP.id ? editingIP : ip
    );
    onUpdate(updated);
    setShowModal(false);
    setEditingIP(null);
  };

  const handleRelease = (ipId: string) => {
    if (!confirm('Освободить IP-адрес? Все данные будут удалены.')) return;
    const updated = ipAssignments.map((ip) =>
      ip.id === ipId
        ? { ...ip, assignments: [], devices: [], notes: undefined }
        : ip
    );
    onUpdate(updated);
  };

  const addDevice = () => {
    if (!editingIP) return;
    const newDevice: Device = {
      id: generateId(),
      type: 'laptop',
      name: '',
    };
    setEditingIP({ ...editingIP, devices: [...(editingIP.devices || []), newDevice] });
  };

  const updateDevice = (deviceId: string, field: keyof Device, value: string) => {
    if (!editingIP) return;
    const devices = (editingIP.devices || []).map((d) =>
      d.id === deviceId ? { ...d, [field]: value } : d
    );
    setEditingIP({ ...editingIP, devices });
  };

  const removeDevice = (deviceId: string) => {
    if (!editingIP) return;
    setEditingIP({
      ...editingIP,
      devices: (editingIP.devices || []).filter((d) => d.id !== deviceId),
    });
  };

  const addAssignment = () => {
    if (!editingIP) return;
    const newAssignment: EmployeeAssignment = {
      id: generateId(),
      employeeId: '',
      assignedDate: new Date().toISOString().split('T')[0],
    };
    setEditingIP({ ...editingIP, assignments: [...(editingIP.assignments || []), newAssignment] });
  };

  const updateAssignment = (assignmentId: string, field: keyof EmployeeAssignment, value: string) => {
    if (!editingIP) return;
    const assignments = (editingIP.assignments || []).map((a) =>
      a.id === assignmentId ? { ...a, [field]: value } : a
    );
    setEditingIP({ ...editingIP, assignments });
  };

  const removeAssignment = (assignmentId: string) => {
    if (!editingIP) return;
    setEditingIP({
      ...editingIP,
      assignments: (editingIP.assignments || []).filter((a) => a.id !== assignmentId),
    });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Пул IP-адресов</h2>
        <p className="text-sm text-gray-500">Управление и мониторинг сетевых адресов</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по IP, сотруднику, кабинету..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Все', count: ipAssignments.length },
            { key: 'free', label: 'Свободные', count: ipAssignments.filter((ip) => (ip.assignments?.length || 0) === 0 && (ip.devices?.length || 0) === 0).length },
            { key: 'used', label: 'Занятые', count: ipAssignments.filter((ip) => (ip.assignments?.length || 0) > 0 || (ip.devices?.length || 0) > 0).length },
          ].map((filter) => (
            <motion.button
              key={filter.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus(filter.key as any)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                filterStatus === filter.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter size={14} />
              <span className="hidden sm:inline">{filter.label}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${filterStatus === filter.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {filter.count}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">IP-адрес</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Статус</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Сотрудники</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Кабинет</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Устройства</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredIPs.slice(0, 50).map((ip, index) => {
                const isUsed = (ip.assignments?.length || 0) > 0 || (ip.devices?.length || 0) > 0;
                return (
                  <motion.tr
                    key={ip.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-gray-100"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">
                        {ip.ipAddress}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        isUsed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isUsed ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {isUsed ? 'Занят' : 'Свободен'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(ip.assignments?.length || 0) > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ip.assignments?.map((a) => (
                            <span key={a.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                              {getEmployeeName(a.employeeId)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {ip.room ? (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {ip.room}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {(ip.devices?.length || 0) > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {ip.devices?.map((d) => (
                            <span key={d.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {DEVICE_ICONS[d.type]}
                              {d.name || DEVICE_TYPE_LABELS[d.type]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(ip)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit3 size={14} />
                        </motion.button>
                        {isUsed && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRelease(ip.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showModal && editingIP && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Редактирование</h3>
                  <p className="text-sm text-gray-500 font-mono">{editingIP.ipAddress}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </motion.button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Кабинет</label>
                  <input
                    type="text"
                    value={editingIP.room || ''}
                    onChange={(e) => setEditingIP({ ...editingIP, room: e.target.value })}
                    placeholder="Номер кабинета"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                {/* Devices Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-700">Устройства на этом IP</label>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addDevice}
                      className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 font-medium"
                    >
                      <Plus size={12} />
                      Добавить устройство
                    </motion.button>
                  </div>

                  {(editingIP.devices?.length || 0) === 0 && (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <Monitor size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400">Нет устройств</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {(editingIP.devices || []).map((device) => (
                      <div key={device.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs text-gray-600 font-medium mb-1 block">Тип</label>
                            <select
                              value={device.type}
                              onChange={(e) => updateDevice(device.id, 'type', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm"
                            >
                              <option value="laptop">Ноутбук</option>
                              <option value="desktop">ПК</option>
                              <option value="printer">Принтер</option>
                              <option value="mfp">МФУ</option>
                              <option value="other">Другое</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 font-medium mb-1 block">Название</label>
                            <input
                              type="text"
                              value={device.name}
                              onChange={(e) => updateDevice(device.id, 'name', e.target.value)}
                              placeholder="Модель"
                              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600 font-medium mb-1 block">Инв. номер</label>
                            <input
                              type="text"
                              value={device.inventoryNumber || ''}
                              onChange={(e) => updateDevice(device.id, 'inventoryNumber', e.target.value)}
                              placeholder="ИНВ-00001"
                              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 font-medium mb-1 block">MAC-адрес</label>
                            <input
                              type="text"
                              value={device.macAddress || ''}
                              onChange={(e) => updateDevice(device.id, 'macAddress', e.target.value)}
                              placeholder="AA:BB:CC:DD:EE:FF"
                              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm"
                            />
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => removeDevice(device.id)}
                          className="mt-3 text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
                        >
                          <Trash2 size={12} />
                          Удалить устройство
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Employees Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users size={16} />
                      Сотрудники
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addAssignment}
                      className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 font-medium"
                    >
                      <Plus size={12} />
                      Добавить сотрудника
                    </motion.button>
                  </div>

                  {(editingIP.assignments?.length || 0) === 0 && (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <Users size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400">Нет назначений</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {(editingIP.assignments || []).map((assignment) => (
                      <div key={assignment.id} className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 font-medium mb-1.5 block">Сотрудник</label>
                            <EmployeeAutocomplete
                              employees={employees}
                              value={assignment.employeeId}
                              onChange={(employeeId) => updateAssignment(assignment.id, 'employeeId', employeeId)}
                            />
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeAssignment(assignment.id)}
                            className="ml-3 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 font-medium mb-1.5 block">Дата назначения</label>
                          <input
                            type="date"
                            value={assignment.assignedDate}
                            onChange={(e) => updateAssignment(assignment.id, 'assignedDate', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Сохранить
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Отмена
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
