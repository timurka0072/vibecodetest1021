import React, { useState } from 'react';
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

export default function IPPool({ ipAssignments, onUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'free' | 'used'>('all');
  const [editingIP, setEditingIP] = useState<IPAssignment | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredIPs = ipAssignments.filter(ip => {
    const matchesSearch = 
      ip.ipAddress.includes(search) ||
      (ip.assignedTo && ip.assignedTo.toLowerCase().includes(search.toLowerCase())) ||
      (ip.room && ip.room.includes(search));
    
    const isUsed = ip.assignedTo || ip.devices.length > 0;
    const matchesFilter = filterStatus === 'all' || 
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
    const updated = ipAssignments.map(ip => ip.id === editingIP.id ? editingIP : ip);
    onUpdate(updated);
    setShowModal(false);
    setEditingIP(null);
  };

  const handleRelease = (ipId: string) => {
    if (!confirm('Освободить IP-адрес? Все данные будут удалены.')) return;
    const updated = ipAssignments.map(ip => 
      ip.id === ipId ? { ...ip, assignedTo: undefined, assignedDate: undefined, devices: [], notes: undefined } : ip
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
    const devices = editingIP.devices.map(d => 
      d.id === deviceId ? { ...d, [field]: value } : d
    );
    setEditingIP({ ...editingIP, devices });
  };

  const removeDevice = (deviceId: string) => {
    if (!editingIP) return;
    setEditingIP({ ...editingIP, devices: editingIP.devices.filter(d => d.id !== deviceId) });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Пул IP-адресов</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Поиск по IP, сотруднику, кабинету..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все</option>
            <option value="free">Свободные</option>
            <option value="used">Занятые</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">IP-адрес</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Статус</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Сотрудник</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Кабинет</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Устройства</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredIPs.slice(0, 50).map(ip => {
                const isUsed = ip.assignedTo || ip.devices.length > 0;
                return (
                  <tr key={ip.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-mono font-medium text-gray-800">{ip.ipAddress}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isUsed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isUsed ? 'Занят' : 'Свободен'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-700">{ip.assignedTo || '—'}</td>
                    <td className="py-2.5 px-4 text-gray-700">{ip.room || '—'}</td>
                    <td className="py-2.5 px-4">
                      {ip.devices.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {ip.devices.map(d => (
                            <span key={d.id} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                              {d.name || DEVICE_TYPE_LABELS[d.type]}
                            </span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(ip)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                        >
                          Изменить
                        </button>
                        {isUsed && (
                          <button
                            onClick={() => handleRelease(ip.id)}
                            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                          >
                            Освободить
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredIPs.length > 50 && (
          <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 border-t">
            Показано 50 из {filteredIPs.length} записей. Уточните поиск.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && editingIP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  IP-адрес: <span className="font-mono">{editingIP.ipAddress}</span>
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник</label>
                  <input
                    type="text"
                    value={editingIP.assignedTo || ''}
                    onChange={(e) => setEditingIP({ ...editingIP, assignedTo: e.target.value })}
                    placeholder="ФИО сотрудника"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Кабинет</label>
                  <input
                    type="text"
                    value={editingIP.room || ''}
                    onChange={(e) => setEditingIP({ ...editingIP, room: e.target.value })}
                    placeholder="Номер кабинета"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата назначения</label>
                  <input
                    type="date"
                    value={editingIP.assignedDate || ''}
                    onChange={(e) => setEditingIP({ ...editingIP, assignedDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
                  <textarea
                    value={editingIP.notes || ''}
                    onChange={(e) => setEditingIP({ ...editingIP, notes: e.target.value })}
                    placeholder="Дополнительная информация"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                {/* Devices Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Устройства</label>
                    <button
                      onClick={addDevice}
                      className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                    >
                      + Добавить устройство
                    </button>
                  </div>
                  
                  {editingIP.devices.length === 0 && (
                    <p className="text-sm text-gray-400 italic">Нет устройств</p>
                  )}

                  <div className="space-y-3">
                    {editingIP.devices.map(device => (
                      <div key={device.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="text-xs text-gray-500">Тип</label>
                            <select
                              value={device.type}
                              onChange={(e) => updateDevice(device.id, 'type', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="laptop">Ноутбук</option>
                              <option value="desktop">ПК</option>
                              <option value="printer">Принтер</option>
                              <option value="mfp">МФУ</option>
                              <option value="other">Другое</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Название</label>
                            <input
                              type="text"
                              value={device.name}
                              onChange={(e) => updateDevice(device.id, 'name', e.target.value)}
                              placeholder="Модель/название"
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500">Инв. номер</label>
                            <input
                              type="text"
                              value={device.inventoryNumber || ''}
                              onChange={(e) => updateDevice(device.id, 'inventoryNumber', e.target.value)}
                              placeholder="ИНВ-00001"
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">MAC-адрес</label>
                            <input
                              type="text"
                              value={device.macAddress || ''}
                              onChange={(e) => updateDevice(device.id, 'macAddress', e.target.value)}
                              placeholder="AA:BB:CC:DD:EE:FF"
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeDevice(device.id)}
                          className="mt-2 text-xs text-red-500 hover:text-red-700"
                        >
                          Удалить устройство
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
