import React, { useState } from 'react';
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

  const filteredSigs = signatures.filter(sig => {
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
    
    // Update status based on expiry date
    const status = getSignatureStatus(editingSig.expiryDate);
    const updatedSig = { ...editingSig, status };

    const existing = signatures.find(s => s.id === updatedSig.id);
    let updated: DigitalSignature[];
    
    if (existing) {
      updated = signatures.map(s => s.id === updatedSig.id ? updatedSig : s);
    } else {
      updated = [...signatures, updatedSig];
    }
    
    onUpdate(updated);
    setShowModal(false);
    setEditingSig(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить запись об ЭЦП?')) return;
    onUpdate(signatures.filter(s => s.id !== id));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Активна</span>;
      case 'expiring':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Истекает</span>;
      case 'expired':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Просрочена</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">—</span>;
    }
  };

  const getDaysRemaining = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `Просрочена на ${Math.abs(diffDays)} дн.`;
    if (diffDays === 0) return 'Истекает сегодня';
    return `${diffDays} дн.`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Электронные подписи (ЭЦП)</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Поиск по ФИО, издателю..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все</option>
            <option value="active">Активные</option>
            <option value="expiring">Истекают</option>
            <option value="expired">Просрочены</option>
          </select>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + Добавить ЭЦП
          </button>
        </div>
      </div>

      {/* Alert for expiring signatures */}
      {signatures.filter(s => s.status === 'expiring').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-medium text-amber-800">Внимание! Истекающие подписи</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {signatures.filter(s => s.status === 'expiring').map(s => (
              <span key={s.id} className="text-sm text-amber-700">
                {s.employeeName} — {getDaysRemaining(s.expiryDate)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">ФИО</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Удостоверяющий центр</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Серийный номер</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Дата выдачи</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Срок действия</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Осталось</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Статус</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredSigs.map(sig => (
                <tr key={sig.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-medium text-gray-800">{sig.employeeName}</td>
                  <td className="py-2.5 px-4 text-gray-700">{sig.issuer}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-gray-600">{sig.serialNumber}</td>
                  <td className="py-2.5 px-4 text-gray-700">{sig.issueDate}</td>
                  <td className="py-2.5 px-4 text-gray-700">{sig.expiryDate}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-xs font-medium ${
                      sig.status === 'expired' ? 'text-red-600' : 
                      sig.status === 'expiring' ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {getDaysRemaining(sig.expiryDate)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">{getStatusBadge(sig.status)}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(sig)}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(sig.id)}
                        className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSigs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Нет записей об ЭЦП
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && editingSig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {signatures.find(s => s.id === editingSig.id) ? 'Редактировать ЭЦП' : 'Новая ЭЦП'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ФИО сотрудника</label>
                  <input
                    type="text"
                    value={editingSig.employeeName}
                    onChange={(e) => setEditingSig({ ...editingSig, employeeName: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Удостоверяющий центр</label>
                  <input
                    type="text"
                    value={editingSig.issuer}
                    onChange={(e) => setEditingSig({ ...editingSig, issuer: e.target.value })}
                    placeholder='ООО "УЦ Пример"'
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Серийный номер</label>
                  <input
                    type="text"
                    value={editingSig.serialNumber}
                    onChange={(e) => setEditingSig({ ...editingSig, serialNumber: e.target.value })}
                    placeholder="01 A2 B3 C4 D5"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата выдачи</label>
                    <input
                      type="date"
                      value={editingSig.issueDate}
                      onChange={(e) => setEditingSig({ ...editingSig, issueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Срок действия до</label>
                    <input
                      type="date"
                      value={editingSig.expiryDate}
                      onChange={(e) => setEditingSig({ ...editingSig, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
