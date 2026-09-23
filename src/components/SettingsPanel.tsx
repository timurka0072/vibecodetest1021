import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Save, Network } from 'lucide-react';
import { NetworkSettings } from '../types';
import { generateId } from '../store';

interface Props {
  networks: NetworkSettings[];
  onUpdate: (networks: NetworkSettings[]) => void;
}

export default function SettingsPanel({ networks, onUpdate }: Props) {
  const [editingNetwork, setEditingNetwork] = useState<NetworkSettings | null>(null);
  const [showModal, setShowModal] = useState(false);

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
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Настройки сетей</h2>
        <p className="text-sm text-gray-500">Управление IP-сетями и адресными пространствами</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <div className="text-amber-600 flex-shrink-0 mt-0.5">⚠️</div>
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Внимание!</p>
          <p className="text-sm text-amber-700">
            Изменение настроек сети приведёт к пересозданию пула IP-адресов. Существующие назначения будут сохранены для совпадающих адресов.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Network size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Настроенные сети</h3>
            <p className="text-sm text-gray-500">{networks.length} {networks.length === 1 ? 'сеть' : 'сетей'}</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} />
          Добавить сеть
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {networks.map((network) => (
          <div key={network.id} className="bg-white rounded-lg border border-gray-200 p-6 card-hover">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{network.name}</h4>
                <p className="text-sm text-gray-500 font-mono">
                  {network.networkAddress}/{network.subnetMask}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(network)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(network.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
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
          </div>
        ))}
      </div>

      {networks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Network size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">Нет настроенных сетей</p>
          <p className="text-sm text-gray-400 mt-1">Нажмите «Добавить сеть» для начала работы</p>
        </div>
      )}

      {/* Modal */}
      {showModal && editingNetwork && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <Network size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {networks.find((n) => n.id === editingNetwork.id) ? 'Редактировать сеть' : 'Новая сеть'}
                  </h3>
                  <p className="text-xs text-gray-500">Настройки IP-сети</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Маска подсети (CIDR)
                </label>
                <select
                  value={editingNetwork.subnetMask}
                  onChange={(e) => setEditingNetwork({ ...editingNetwork, subnetMask: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <p className="text-sm text-indigo-800">
                  <span className="font-semibold">Будет создано:</span>{' '}
                  {calculateIPCount(editingNetwork.startIP, editingNetwork.endIP)} IP-адресов
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Сохранить
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
