import React from 'react';
import { motion } from 'framer-motion';
import { Globe, CheckCircle2, Clock, Monitor, Building2, Shield, ArrowUpRight } from 'lucide-react';
import { IPAssignment, DigitalSignature, Employee } from '../types';

interface Props {
  ipAssignments: IPAssignment[];
  signatures: DigitalSignature[];
  employees: Employee[];
}

export default function Dashboard({ ipAssignments, signatures, employees }: Props) {
  const totalIPs = ipAssignments.length;
  const usedIPs = ipAssignments.filter(
    (ip) => (ip.assignments?.length || 0) > 0 || (ip.devices?.length || 0) > 0
  ).length;
  const freeIPs = totalIPs - usedIPs;
  const usagePercent = totalIPs > 0 ? Math.round((usedIPs / totalIPs) * 100) : 0;
  const totalDevices = ipAssignments.reduce(
    (sum, ip) => sum + (ip.devices?.length || 0),
    0
  );
  const activeSignatures = signatures.filter((s) => s.status === 'active').length;
  const expiringSignatures = signatures.filter((s) => s.status === 'expiring').length;
  const expiredSignatures = signatures.filter((s) => s.status === 'expired').length;
  const rooms = [...new Set(ipAssignments.filter((ip) => ip.room).map((ip) => ip.room))];

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? emp.fullName : 'Неизвестный';
  };

  const stats = [
    { label: 'Всего IP', value: totalIPs, icon: <Globe size={24} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Использовано', value: usedIPs, icon: <CheckCircle2 size={24} />, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Свободно', value: freeIPs, icon: <Clock size={24} />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Устройств', value: totalDevices, icon: <Monitor size={24} />, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 page-enter">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Панель управления</h2>
        <p className="text-sm text-gray-500">Обзор состояния сети и ресурсов</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-5 card-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Заполненность пула</h3>
            <p className="text-sm text-gray-500">Распределение адресного пространства</p>
          </div>
          <p className="text-3xl font-semibold text-indigo-600">{usagePercent}%</p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-indigo-600 rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>{usedIPs} использовано</span>
          <span>{freeIPs} свободно</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <Shield size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Статус ЭЦП</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">Активные</span>
              <span className="font-semibold text-green-600">{activeSignatures}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span className="text-sm text-gray-700">Истекают</span>
              <span className="font-semibold text-amber-600">{expiringSignatures}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-700">Просрочены</span>
              <span className="font-semibold text-red-600">{expiredSignatures}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center text-pink-600">
              <Building2 size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Кабинеты</h3>
          </div>
          {rooms.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {rooms.sort().map((room) => (
                <span key={room} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  Каб. {room}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <ArrowUpRight size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Последние назначения</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">IP</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Сотрудники</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Кабинет</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Устройства</th>
              </tr>
            </thead>
            <tbody>
              {ipAssignments
                .filter((ip) => (ip.assignments?.length || 0) > 0)
                .sort((a, b) => {
                  const aDate = a.assignments?.[0]?.assignedDate || '';
                  const bDate = b.assignments?.[0]?.assignedDate || '';
                  return new Date(bDate).getTime() - new Date(aDate).getTime();
                })
                .slice(0, 5)
                .map((ip) => (
                  <tr key={ip.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-mono text-xs">{ip.ipAddress}</td>
                    <td className="py-2 px-3 text-sm">
                      {ip.assignments?.map(a => getEmployeeName(a.employeeId)).join(', ')}
                    </td>
                    <td className="py-2 px-3 text-sm">{ip.room || '—'}</td>
                    <td className="py-2 px-3 text-sm">{ip.devices?.length || 0} шт.</td>
                  </tr>
                ))}
              {ipAssignments.filter((ip) => (ip.assignments?.length || 0) > 0).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">Нет назначений</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
