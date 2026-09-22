import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Edit3, Trash2, X, Save, Network, AlertCircle } from 'lucide-react';
import { NetworkSettings } from '../types';
import { generateId } from '../store';

interface Props {
  networks: NetworkSettings[];
  onUpdate: (networks: NetworkSettings[]) => void;
}

export default function SettingsPanel({ networks, onUpdate }: Props) {
  const [editingNetwork, setEditingNetwork] = useState<NetworkSettings | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleAdd = () => {
    setEditingNetwork({
      id: generateId(),
      name: '',
      networkAddress: '192.168.1.0',
      subnetMask: '24',
      startIP: 1,
      endIP: 254,
    });
    setShowModal(true);
  };

  const handleEdit = (network: NetworkSettings) => {
    setEditingNetwork({ ...network });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingNetwork) return;
    
    if (!editingNetwork.name) {
      alert('Укажите название сети');
      return;
    }

    const existing = networks.find((n) => n.id === editingNetwork.id);
    let updated: NetworkSettings[];

    if (existing) {
      updated = networks.map((n) => (n.id === editingNetwork.id ? editingNetwork : n));
    } else {
      updated = [...networks, editingNetwork];
    }

    onUpdate(updated);
    setShowModal(false);
    setEditingNetwork(null);
  };

  const handleDelete = (id: string) => {
    if (networks.length === 1) {
      alert('Нельзя удалить единственную сеть');
      return;
    }
    if (!confirm('Удалить эту сеть? Все IP-адреса из этой сети будут удалены.')) return;
    onUpdate(networks.filter((n) => n.id !== id));
  };

  const calculateIPCount = (start: number, end: number) => {
    return Math.max(0, end - start + 1);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-800 mb-1">Настройки сетей</h2>
        <p className="text-gray-500">Управление IP-сетями и адресными пространствами</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
      >
        <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Внимание!</p>
          <p className="text-sm text-amber-700">
            Изменение настроек сети приведёт к пересозданию пула IP-адресов. Существующие назначения будут сохранены для совпадающих адресов.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Network size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Настроенные сети</h3>
            <p className="text-sm text-gray-500">{networks.length} {networks.length === 1 ? 'сеть' : 'сетей'}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg shadow-indigo-200/50 transition-all text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} />
          Добавить сеть
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {networks.map((network, index) => (
          <motion.div
            key={network.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-1">{network.name}</h4>
                <p className="text-sm text-gray-500 font-mono">
                  {network.networkAddress}/{network.subnetMask}
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEdit(network)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Edit3 size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(network.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Диапазон IP:</span>
                <span className="font-semibold text-gray-800">
                  {network.networkAddress.split('.').slice(0, 3).join('.')}.{network.startIP} - {network.networkAddress.split('.').slice(0, 3).join('.')}.{network.endIP}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Количество адресов:</span>
                <span className="font-semibold text-indigo-600">
                  {calculateIPCount(network.startIP, network.endIP)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {networks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50"
        >
          <Network size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">Нет настроенных сетей</p>
          <p className="text-sm text-gray-400 mt-1">Нажмите «Добавить сеть» для начала работы</p>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && editingNetwork && (
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {networks.find((n) => n.id === editingNetwork.id) ? 'Редактировать сеть' : 'Новая сеть'}
                    </h3>
                    <p className="text-xs text-gray-500">Настройки IP-сети</p>
                  </div>
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
                    Название сети *
                  </label>
                  <input
                    type="text"
                    value={editingNetwork.name}
                    onChange={(e) => setEditingNetwork({ ...editingNetwork, name: e.target.value })}
                    placeholder="Основная сеть"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Сетевой адрес
                  </label>
                  <input
                    type="text"
                    value={editingNetwork.networkAddress}
                    onChange={(e) => setEditingNetwork({ ...editingNetwork, networkAddress: e.target.value })}
                    placeholder="192.168.1.0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Маска подсети (CIDR)
                  </label>
                  <select
                    value={editingNetwork.subnetMask}
                    onChange={(e) => setEditingNetwork({ ...editingNetwork, subnetMask: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                  >
                    <option value="16">/16 (255.255.0.0) - 65534 адресов</option>
                    <option value="17">/17 (255.255.128.0) - 32766 адресов</option>
                    <option value="18">/18 (255.255.192.0) - 16382 адресов</option>
                    <option value="19">/19 (255.255.224.0) - 8190 адресов</option>
                    <option value="20">/20 (255.255.240.0) - 4094 адресов</option>
                    <option value="21">/21 (255.255.248.0) - 2046 адресов</option>
                    <option value="22">/22 (255.255.252.0) - 1022 адресов</option>
                    <option value="23">/23 (255.255.254.0) - 510 адресов</option>
                    <option value="24">/24 (255.255.255.0) - 254 адресов</option>
                    <option value="25">/25 (255.255.255.128) - 126 адресов</option>
                    <option value="26">/26 (255.255.255.192) - 62 адресов</option>
                    <option value="27">/27 (255.255.255.224) - 30 адресов</option>
                    <option value="28">/28 (255.255.255.240) - 14 адресов</option>
                    <option value="29">/29 (255.255.255.248) - 6 адресов</option>
                    <option value="30">/30 (255.255.255.252) - 2 адресов</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Начальный IP (последняя октета)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="254"
                      value={editingNetwork.startIP}
                      onChange={(e) => setEditingNetwork({ ...editingNetwork, startIP: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Конечный IP (последняя октета)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="254"
                      value={editingNetwork.endIP}
                      onChange={(e) => setEditingNetwork({ ...editingNetwork, endIP: parseInt(e.target.value) || 254 })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                    />
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                  <p className="text-sm text-indigo-800">
                    <span className="font-semibold">Будет создано:</span>{' '}
                    {calculateIPCount(editingNetwork.startIP, editingNetwork.endIP)} IP-адресов
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
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
