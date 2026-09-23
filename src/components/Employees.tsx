import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Save, Users } from 'lucide-react';
import { Employee } from '../types';
import { generateId } from '../store';

interface Props {
  employees: Employee[];
  onUpdate: (employees: Employee[]) => void;
}

export default function Employees({ employees, onUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (emp.position && emp.position.toLowerCase().includes(search.toLowerCase())) ||
    (emp.department && emp.department.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    setEditingEmployee({
      id: generateId(),
      fullName: '',
      position: '',
      department: '',
      email: '',
      phone: '',
    });
    setShowModal(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee({ ...emp });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingEmployee || !editingEmployee.fullName) {
      alert('Укажите ФИО сотрудника');
      return;
    }

    const existing = employees.find(e => e.id === editingEmployee.id);
    let updated: Employee[];

    if (existing) {
      updated = employees.map(e => e.id === editingEmployee.id ? editingEmployee : e);
    } else {
      updated = [...employees, editingEmployee];
    }

    onUpdate(updated);
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить сотрудника из справочника?')) return;
    onUpdate(employees.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Справочник сотрудников</h2>
        <p className="text-sm text-gray-500">Управление базой сотрудников организации</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Поиск по ФИО, должности, отделу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} />
          Добавить сотрудника
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">ФИО</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Должность</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Отдел</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Телефон</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">{emp.fullName}</td>
                  <td className="py-3 px-4 text-gray-600">{emp.position || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{emp.department || '—'}</td>
                  <td className="py-3 px-4 text-gray-600 text-sm">{emp.email || '—'}</td>
                  <td className="py-3 px-4 text-gray-600 text-sm">{emp.phone || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Users size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Нет сотрудников</p>
                    <p className="text-xs mt-1">Нажмите «Добавить сотрудника» для начала работы</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && editingEmployee && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {employees.find(e => e.id === editingEmployee.id) ? 'Редактировать сотрудника' : 'Новый сотрудник'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ФИО *</label>
                <input
                  type="text"
                  value={editingEmployee.fullName}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, fullName: e.target.value })}
                  placeholder="Иванов Иван Иванович"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Должность</label>
                <input
                  type="text"
                  value={editingEmployee.position || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                  placeholder="Инженер"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Отдел</label>
                <input
                  type="text"
                  value={editingEmployee.department || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                  placeholder="ИТ-отдел"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editingEmployee.email || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    placeholder="ivanov@company.ru"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Телефон</label>
                  <input
                    type="tel"
                    value={editingEmployee.phone || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Сохранить
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
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
