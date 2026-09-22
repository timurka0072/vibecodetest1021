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
import { IPAssignment, Device, DeviceType, EmployeeAssignment } from '../types';
import { generateId } from '../store';

interface Props {
  ipAssignments: IPAssignment[];
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

export default function IPPool({ ipAssignments, onUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'free' | 'used'>('all');
  const [editingIP, setEditingIP] = useState<IPAssignment | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredIPs = ipAssignments.filter((ip) => {
    const matchesSearch =
      ip.ipAddress.includes(search) ||
      (ip.assignments?.some(a => a.employeeName.toLowerCase().includes(search.toLowerCase())) || false) ||
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
      assignments: (ip.assignments || []).map(a => ({ ...a, devices: [...(a.devices || [])] }))
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
        ? {
            ...ip,
            assignments: [],
            devices: [],
            notes: undefined,
          }
        : ip
    );
    onUpdate(updated);
  };

  const addAssignment = () => {
    if (!editingIP) return;
    const newAssignment: EmployeeAssignment = {
      id: generateId(),
      employeeName: '',
      assignedDate: new Date().toISOString().split('T')[0],
      devices: [],
    };
    setEditingIP({ ...editingIP, assignments: [...editingIP.assignments, newAssignment] });
  };

  const updateAssignment = (assignmentId: string, field: keyof EmployeeAssignment, value: string) => {
    if (!editingIP) return;
    const assignments = editingIP.assignments.map((a) =>
      a.id === assignmentId ? { ...a, [field]: value } : a
    );
    setEditingIP({ ...editingIP, assignments });
  };

  const removeAssignment = (assignmentId: string) => {
    if (!editingIP) return;
    setEditingIP({
      ...editingIP,
      assignments: editingIP.assignments.filter((a) => a.id !== assignmentId),
    });
  };

  const addDeviceToAssignment = (assignmentId: string) => {
    if (!editingIP) return;
    const newDevice: Device = {
      id: generateId(),
      type: 'laptop',
      name: '',
    };
    const assignments = editingIP.assignments.map((a) =>
      a.id === assignmentId ? { ...a, devices: [...a.devices, newDevice] } : a
    );
    setEditingIP({ ...editingIP, assignments });
  };

  const updateDeviceInAssignment = (assignmentId: string, deviceId: string, field: keyof Device, value: string) => {
    if (!editingIP) return;
    const assignments = editingIP.assignments.map((a) => {
      if (a.id === assignmentId) {
        const devices = a.devices.map((d) =>
          d.id === deviceId ? { ...d, [field]: value } : d
        );
        return { ...a, devices };
      }
      return a;
    });
    setEditingIP({ ...editingIP, assignments });
  };

  const removeDeviceFromAssignment = (assignmentId: string, deviceId: string) => {
    if (!editingIP) return;
    const assignments = editingIP.assignments.map((a) => {
      if (a.id === assignmentId) {
        return { ...a, devices: a.devices.filter((d) => d.id !== deviceId) };
      }
      return a;
    });
    setEditingIP({ ...editingIP, assignments });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-1">
            Пул IP-адресов
          </h2>
          <p className="text-gray-500">
            Управление и мониторинг сетевых адресов
          </p>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Поиск по IP, сотруднику, кабинету..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Все', count: ipAssignments.length },
              {
                key: 'free',
                label: 'Свободные',
                count: ipAssignments.filter(
                  (ip) => (ip.assignments?.length || 0) === 0 && (ip.devices?.length || 0) === 0
                ).length,
              },
              {
                key: 'used',
                label: 'Занятые',
                count: ipAssignments.filter(
                  (ip) => (ip.assignments?.length || 0) > 0 || (ip.devices?.length || 0) > 0
                ).length,
              },
            ].map((filter) => (
              <motion.button
                key={filter.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(filter.key as any)}
                className={`px-5 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  filterStatus === filter.key
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200/50'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Filter size={14} />
                <span className="hidden sm:inline">{filter.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs ${
                    filterStatus === filter.key
                      ? 'bg-white/20'
                      : 'bg-gray-200'
                  }`}
                >
                  {filter.count}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200/50">
              <tr>
                <th className="text-left py-5 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  IP-адрес
                </th>
                <th className="text-left py-5 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Статус
                </th>
                <th className="text-left py-5 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Сотрудники
                </th>
                <th className="text-left py-5 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Кабинет
                </th>
                <th className="text-left py-5 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Устройства
                </th>
                <th className="text-left py-5 px-6 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredIPs.slice(0, 50).map((ip, index) => {
                  const isUsed = (ip.assignments?.length || 0) > 0 || (ip.devices?.length || 0) > 0;
                  return (
                    <motion.tr
                      key={ip.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200"
                    >
                      <td className="py-5 px-6">
                        <span className="font-mono font-semibold text-gray-800 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs border border-indigo-100">
                          {ip.ipAddress}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            isUsed
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isUsed ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {isUsed ? 'Занят' : 'Свободен'}
                        </motion.span>
                      </td>
                      <td className="py-5 px-6">
                        {(ip.assignments?.length || 0) > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {ip.assignments?.map((a) => (
                              <span key={a.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                                {a.employeeName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        {ip.room ? (
                          <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">
                            {ip.room}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        {(ip.devices?.length || 0) > 0 || (ip.assignments?.some(a => (a.devices?.length || 0) > 0) || false) ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
                            {(ip.devices?.length || 0) + (ip.assignments?.reduce((s, a) => s + (a.devices?.length || 0), 0) || 0)} шт.
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(ip)}
                            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Редактировать"
                          >
                            <Edit3 size={16} />
                          </motion.button>
                          {isUsed && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRelease(ip.id)}
                              className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Освободить"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredIPs.length > 50 && (
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 text-sm text-amber-700 border-t border-amber-100 flex items-center gap-2">
            <Filter size={14} />
            Показано 50 из {filteredIPs.length} записей. Уточните поиск.
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showModal && editingIP && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-sm p-6 border-b border-gray-100 flex justify-between items-center z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Редактирование
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">
                    {editingIP.ipAddress}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </motion.button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Кабинет
                  </label>
                  <input
                    type="text"
                    value={editingIP.room || ''}
                    onChange={(e) =>
                      setEditingIP({ ...editingIP, room: e.target.value })
                    }
                    placeholder="Номер кабинета"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Примечания
                  </label>
                  <textarea
                    value={editingIP.notes || ''}
                    onChange={(e) =>
                      setEditingIP({ ...editingIP, notes: e.target.value })
                    }
                    placeholder="Дополнительная информация"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                    rows={2}
                  />
                </div>

                {/* Assignments Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Users size={16} />
                      Сотрудники
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addAssignment}
                      className="px-4 py-2 text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-1.5 font-medium"
                    >
                      <Plus size={14} />
                      Добавить сотрудника
                    </motion.button>
                  </div>

                  {editingIP.assignments.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
                    >
                      <Users
                        size={32}
                        className="mx-auto text-gray-300 mb-2"
                      />
                      <p className="text-sm text-gray-400">
                        Нет назначений. Нажмите «Добавить сотрудника»
                      </p>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <AnimatePresence>
                      {editingIP.assignments.map((assignment, index) => (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-xl border border-blue-200/50"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 font-medium mb-1.5 block">
                                  ФИО сотрудника
                                </label>
                                <input
                                  type="text"
                                  value={assignment.employeeName}
                                  onChange={(e) =>
                                    updateAssignment(
                                      assignment.id,
                                      'employeeName',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Иванов И.И."
                                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 font-medium mb-1.5 block">
                                  Дата назначения
                                </label>
                                <input
                                  type="date"
                                  value={assignment.assignedDate}
                                  onChange={(e) =>
                                    updateAssignment(
                                      assignment.id,
                                      'assignedDate',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeAssignment(assignment.id)}
                              className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Удалить сотрудника"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>

                          {/* Devices for this assignment */}
                          <div className="mt-4 pt-4 border-t border-blue-200/50">
                            <div className="flex justify-between items-center mb-3">
                              <label className="text-xs text-gray-600 font-medium">
                                Устройства сотрудника
                              </label>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addDeviceToAssignment(assignment.id)}
                                className="px-3 py-1.5 text-xs bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all flex items-center gap-1 font-medium border border-indigo-200"
                              >
                                <Plus size={12} />
                                Устройство
                              </motion.button>
                            </div>

                            {assignment.devices.length === 0 && (
                              <p className="text-xs text-gray-400 italic">Нет устройств</p>
                            )}

                            <div className="space-y-2">
                              {assignment.devices.map((device) => (
                                <div key={device.id} className="grid grid-cols-4 gap-2 p-3 bg-white rounded-lg border border-gray-200">
                                  <select
                                    value={device.type}
                                    onChange={(e) =>
                                      updateDeviceInAssignment(
                                        assignment.id,
                                        device.id,
                                        'type',
                                        e.target.value
                                      )
                                    }
                                    className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                  >
                                    <option value="laptop">Ноутбук</option>
                                    <option value="desktop">ПК</option>
                                    <option value="printer">Принтер</option>
                                    <option value="mfp">МФУ</option>
                                    <option value="other">Другое</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={device.name}
                                    onChange={(e) =>
                                      updateDeviceInAssignment(
                                        assignment.id,
                                        device.id,
                                        'name',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Модель"
                                    className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                  />
                                  <input
                                    type="text"
                                    value={device.inventoryNumber || ''}
                                    onChange={(e) =>
                                      updateDeviceInAssignment(
                                        assignment.id,
                                        device.id,
                                        'inventoryNumber',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Инв. №"
                                    className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                  />
                                  <div className="flex gap-1">
                                    <input
                                      type="text"
                                      value={device.macAddress || ''}
                                      onChange={(e) =>
                                        updateDeviceInAssignment(
                                          assignment.id,
                                          device.id,
                                          'macAddress',
                                          e.target.value
                                        )
                                      }
                                      placeholder="MAC"
                                      className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => removeDeviceFromAssignment(assignment.id, device.id)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <X size={12} />
                                    </motion.button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm p-6 border-t border-gray-100 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Сохранить
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm"
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
