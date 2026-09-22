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
} from 'lucide-react';
import { IPAssignment, Device, DeviceType } from '../types';
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
      (ip.assignedTo && ip.assignedTo.toLowerCase().includes(search.toLowerCase())) ||
      (ip.room && ip.room.includes(search));

    const isUsed = ip.assignedTo || ip.devices.length > 0;
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'free' && !isUsed) ||
      (filterStatus === 'used' && isUsed);

    return matchesSearch && matchesFilter;
  });

  const handleEdit = (ip: IPAssignment) => {
    setEditingIP({ ...ip, devices: [...ip.devices] });
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
            assignedTo: undefined,
            assignedDate: undefined,
            devices: [],
            notes: undefined,
          }
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
    setEditingIP({ ...editingIP, devices: [...editingIP.devices, newDevice] });
  };

  const updateDevice = (deviceId: string, field: keyof Device, value: string) => {
    if (!editingIP) return;
    const devices = editingIP.devices.map((d) =>
      d.id === deviceId ? { ...d, [field]: value } : d
    );
    setEditingIP({ ...editingIP, devices });
  };

  const removeDevice = (deviceId: string) => {
    if (!editingIP) return;
    setEditingIP({
      ...editingIP,
      devices: editingIP.devices.filter((d) => d.id !== deviceId),
    });
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Поиск по IP, сотруднику, кабинету..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Все', count: ipAssignments.length },
              {
                key: 'free',
                label: 'Свободные',
                count: ipAssignments.filter(
                  (ip) => !ip.assignedTo && ip.devices.length === 0
                ).length,
              },
              {
                key: 'used',
                label: 'Занятые',
                count: ipAssignments.filter(
                  (ip) => ip.assignedTo || ip.devices.length > 0
                ).length,
              },
            ].map((filter) => (
              <motion.button
                key={filter.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(filter.key as any)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  filterStatus === filter.key
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200/50'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Filter size={14} />
                <span className="hidden sm:inline">{filter.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-xs ${
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
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/50">
              <tr>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  IP-адрес
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Статус
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Сотрудник
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Кабинет
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Устройства
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredIPs.slice(0, 50).map((ip, index) => {
                  const isUsed = ip.assignedTo || ip.devices.length > 0;
                  return (
                    <motion.tr
                      key={ip.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-gray-100/50 table-row-hover"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-gray-800 bg-indigo-50 px-2 py-1 rounded-lg text-xs">
                          {ip.ipAddress}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isUsed
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isUsed ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {isUsed ? 'Занят' : 'Свободен'}
                        </motion.span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {ip.assignedTo || '—'}
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
                      <td className="py-3 px-4">
                        {ip.devices.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {ip.devices.map((d) => (
                              <motion.span
                                key={d.id}
                                whileHover={{ scale: 1.1 }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100"
                              >
                                {DEVICE_ICONS[d.type]}
                                {d.name || DEVICE_TYPE_LABELS[d.type]}
                              </motion.span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(ip)}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Редактировать"
                          >
                            <Edit3 size={14} />
                          </motion.button>
                          {isUsed && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRelease(ip.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Освободить"
                            >
                              <Trash2 size={14} />
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
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 text-sm text-amber-700 border-t border-amber-100 flex items-center gap-2">
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
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

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Сотрудник
                  </label>
                  <input
                    type="text"
                    value={editingIP.assignedTo || ''}
                    onChange={(e) =>
                      setEditingIP({ ...editingIP, assignedTo: e.target.value })
                    }
                    placeholder="ФИО сотрудника"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Кабинет
                  </label>
                  <input
                    type="text"
                    value={editingIP.room || ''}
                    onChange={(e) =>
                      setEditingIP({ ...editingIP, room: e.target.value })
                    }
                    placeholder="Номер кабинета"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Дата назначения
                  </label>
                  <input
                    type="date"
                    value={editingIP.assignedDate || ''}
                    onChange={(e) =>
                      setEditingIP({
                        ...editingIP,
                        assignedDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Примечания
                  </label>
                  <textarea
                    value={editingIP.notes || ''}
                    onChange={(e) =>
                      setEditingIP({ ...editingIP, notes: e.target.value })
                    }
                    placeholder="Дополнительная информация"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                    rows={2}
                  />
                </div>

                {/* Devices Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Устройства
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addDevice}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-1 font-medium"
                    >
                      <Plus size={12} />
                      Добавить
                    </motion.button>
                  </div>

                  {editingIP.devices.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
                    >
                      <Monitor
                        size={32}
                        className="mx-auto text-gray-300 mb-2"
                      />
                      <p className="text-sm text-gray-400">
                        Нет устройств. Нажмите «Добавить»
                      </p>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <AnimatePresence>
                      {editingIP.devices.map((device, index) => (
                        <motion.div
                          key={device.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl border border-gray-200/50"
                        >
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="text-xs text-gray-500 font-medium mb-1 block">
                                Тип
                              </label>
                              <select
                                value={device.type}
                                onChange={(e) =>
                                  updateDevice(
                                    device.id,
                                    'type',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              >
                                <option value="laptop">Ноутбук</option>
                                <option value="desktop">ПК</option>
                                <option value="printer">Принтер</option>
                                <option value="mfp">МФУ</option>
                                <option value="other">Другое</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium mb-1 block">
                                Название
                              </label>
                              <input
                                type="text"
                                value={device.name}
                                onChange={(e) =>
                                  updateDevice(
                                    device.id,
                                    'name',
                                    e.target.value
                                  )
                                }
                                placeholder="Модель"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 font-medium mb-1 block">
                                Инв. номер
                              </label>
                              <input
                                type="text"
                                value={device.inventoryNumber || ''}
                                onChange={(e) =>
                                  updateDevice(
                                    device.id,
                                    'inventoryNumber',
                                    e.target.value
                                  )
                                }
                                placeholder="ИНВ-00001"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium mb-1 block">
                                MAC-адрес
                              </label>
                              <input
                                type="text"
                                value={device.macAddress || ''}
                                onChange={(e) =>
                                  updateDevice(
                                    device.id,
                                    'macAddress',
                                    e.target.value
                                  )
                                }
                                placeholder="AA:BB:CC:DD:EE:FF"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              />
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => removeDevice(device.id)}
                            className="mt-3 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
                          >
                            <Trash2 size={12} />
                            Удалить устройство
                          </motion.button>
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
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Сохранить
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm"
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
