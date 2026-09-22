import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
} from 'lucide-react';
import { DigitalSignature } from '../types';
import { generateId, getSignatureStatus } from '../store';

interface Props {
  signatures: DigitalSignature[];
  onUpdate: (signatures: DigitalSignature[]) => void;
}

export default function Signatures({ signatures, onUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSig, setEditingSig] = useState<DigitalSignature | null>(null);

  const filteredSigs = signatures.filter((sig) => {
    const matchesSearch =
      sig.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      sig.issuer.toLowerCase().includes(search.toLowerCase()) ||
      sig.serialNumber.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filterStatus === 'all' || sig.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleAdd = () => {
    setEditingSig({
      id: generateId(),
      employeeId: '',
      employeeName: '',
      issuer: '',
      serialNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleEdit = (sig: DigitalSignature) => {
    setEditingSig({ ...sig });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingSig) return;

    const status = getSignatureStatus(editingSig.expiryDate);
    const updatedSig = { ...editingSig, status };

    const existing = signatures.find((s) => s.id === updatedSig.id);
    let updated: DigitalSignature[];

    if (existing) {
      updated = signatures.map((s) =>
        s.id === updatedSig.id ? updatedSig : s
      );
    } else {
      updated = [...signatures, updatedSig];
    }

    onUpdate(updated);
    setShowModal(false);
    setEditingSig(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить запись об ЭЦП?')) return;
    onUpdate(signatures.filter((s) => s.id !== id));
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: <CheckCircle2 size={12} />,
        label: 'Активна',
      },
      expiring: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: <AlertTriangle size={12} />,
        label: 'Истекает',
      },
      expired: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: <Clock size={12} />,
        label: 'Просрочена',
      },
    };
    const config = configs[status as keyof typeof configs] || configs.active;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getDaysRemaining = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) return `Просрочена на ${Math.abs(diffDays)} дн.`;
    if (diffDays === 0) return 'Истекает сегодня';
    return `${diffDays} дн.`;
  };

  const activeCount = signatures.filter((s) => s.status === 'active').length;
  const expiringCount = signatures.filter((s) => s.status === 'expiring').length;
  const expiredCount = signatures.filter((s) => s.status === 'expired').length;

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
            Электронные подписи
          </h2>
          <p className="text-gray-500">
            Учёт и мониторинг сроков действия ЭЦП
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg shadow-indigo-200/50 transition-all text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} />
          Добавить ЭЦП
        </motion.button>
      </motion.div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Активные',
            count: activeCount,
            gradient: 'from-emerald-500 to-green-500',
            bg: 'from-emerald-50 to-green-50',
            icon: <CheckCircle2 size={20} />,
          },
          {
            label: 'Истекают',
            count: expiringCount,
            gradient: 'from-amber-500 to-orange-500',
            bg: 'from-amber-50 to-orange-50',
            icon: <AlertTriangle size={20} />,
          },
          {
            label: 'Просрочены',
            count: expiredCount,
            gradient: 'from-red-500 to-rose-500',
            bg: 'from-red-50 to-rose-50',
            icon: <Clock size={20} />,
          },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`bg-gradient-to-br ${item.bg} rounded-2xl p-4 border border-white/50 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  {item.label}
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {item.count}
                </p>
              </div>
              <div
                className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}
              >
                {item.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
              placeholder="Поиск по ФИО, издателю, серийному номеру..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Все' },
              { key: 'active', label: 'Активные' },
              { key: 'expiring', label: 'Истекают' },
              { key: 'expired', label: 'Просрочены' },
            ].map((filter) => (
              <motion.button
                key={filter.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(filter.key as any)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterStatus === filter.key
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200/50'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filter.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Alert for expiring */}
      <AnimatePresence>
        {expiringCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <AlertTriangle className="text-amber-600" size={20} />
              </motion.div>
              <span className="font-bold text-amber-800">
                Внимание! Истекающие подписи
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {signatures
                .filter((s) => s.status === 'expiring')
                .map((s) => (
                  <motion.span
                    key={s.id}
                    whileHover={{ scale: 1.05 }}
                    className="text-sm text-amber-700 bg-white/60 px-3 py-1 rounded-lg border border-amber-200"
                  >
                    {s.employeeName} —{' '}
                    <span className="font-semibold">
                      {getDaysRemaining(s.expiryDate)}
                    </span>
                  </motion.span>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/50">
              <tr>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  ФИО
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Удостоверяющий центр
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Серийный номер
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Выдана
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Действует до
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Осталось
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Статус
                </th>
                <th className="text-left py-4 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredSigs.map((sig, index) => (
                  <motion.tr
                    key={sig.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-100/50 table-row-hover"
                  >
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {sig.employeeName}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{sig.issuer}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                        {sig.serialNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {sig.issueDate}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {sig.expiryDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          sig.status === 'expired'
                            ? 'text-red-600'
                            : sig.status === 'expiring'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {getDaysRemaining(sig.expiryDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(sig.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(sig)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                          title="Редактировать"
                        >
                          <Edit3 size={14} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(sig.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredSigs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Shield
                      size={48}
                      className="mx-auto text-gray-200 mb-3"
                    />
                    <p className="font-medium">Нет записей об ЭЦП</p>
                    <p className="text-xs mt-1">
                      Нажмите «Добавить ЭЦП» для создания записи
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && editingSig && (
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
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {signatures.find((s) => s.id === editingSig.id)
                        ? 'Редактировать ЭЦП'
                        : 'Новая ЭЦП'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Электронная цифровая подпись
                    </p>
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
                    ФИО сотрудника
                  </label>
                  <input
                    type="text"
                    value={editingSig.employeeName}
                    onChange={(e) =>
                      setEditingSig({
                        ...editingSig,
                        employeeName: e.target.value,
                      })
                    }
                    placeholder="Иванов Иван Иванович"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Удостоверяющий центр
                  </label>
                  <input
                    type="text"
                    value={editingSig.issuer}
                    onChange={(e) =>
                      setEditingSig({ ...editingSig, issuer: e.target.value })
                    }
                    placeholder='ООО "УЦ Пример"'
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Серийный номер
                  </label>
                  <input
                    type="text"
                    value={editingSig.serialNumber}
                    onChange={(e) =>
                      setEditingSig({
                        ...editingSig,
                        serialNumber: e.target.value,
                      })
                    }
                    placeholder="01 A2 B3 C4 D5"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Дата выдачи
                    </label>
                    <input
                      type="date"
                      value={editingSig.issueDate}
                      onChange={(e) =>
                        setEditingSig({
                          ...editingSig,
                          issueDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Срок действия до
                    </label>
                    <input
                      type="date"
                      value={editingSig.expiryDate}
                      onChange={(e) =>
                        setEditingSig({
                          ...editingSig,
                          expiryDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 input-animated"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
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
