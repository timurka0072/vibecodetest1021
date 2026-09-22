import React from 'react';
import { IPAssignment, DigitalSignature } from '../types';

interface Props {
  ipAssignments: IPAssignment[];
  signatures: DigitalSignature[];
}

export default function Dashboard({ ipAssignments, signatures }: Props) {
  const totalIPs = ipAssignments.length;
  const usedIPs = ipAssignments.filter(ip => ip.assignedTo || ip.devices.length > 0).length;
  const freeIPs = totalIPs - usedIPs;
  const usagePercent = Math.round((usedIPs / totalIPs) * 100);

  const totalDevices = ipAssignments.reduce((sum, ip) => sum + ip.devices.length, 0);
  
  const activeSignatures = signatures.filter(s => s.status === 'active').length;
  const expiringSignatures = signatures.filter(s => s.status === 'expiring').length;
  const expiredSignatures = signatures.filter(s => s.status === 'expired').length;

  const rooms = [...new Set(ipAssignments.filter(ip => ip.room).map(ip => ip.room))];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Панель управления</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Всего IP-адресов</p>
              <p className="text-2xl font-bold text-gray-800">{totalIPs}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Использовано</p>
              <p className="text-2xl font-bold text-green-600">{usedIPs}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Свободно</p>
              <p className="text-2xl font-bold text-amber-600">{freeIPs}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Устройств</p>
              <p className="text-2xl font-bold text-purple-600">{totalDevices}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Заполненность пула IP-адресов</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${usagePercent}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{usagePercent}% использовано ({usedIPs} из {totalIPs})</p>
      </div>

      {/* Signatures Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Статус ЭЦП</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Активные
              </span>
              <span className="font-semibold text-green-600">{activeSignatures}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                Истекают (30 дней)
              </span>
              <span className="font-semibold text-amber-600">{expiringSignatures}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                Просрочены
              </span>
              <span className="font-semibold text-red-600">{expiredSignatures}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Занятые кабинеты</h3>
          <div className="max-h-40 overflow-y-auto">
            {rooms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {rooms.sort().map(room => (
                  <span key={room} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    Каб. {room}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Нет данных</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Последние назначения</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">IP-адрес</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Сотрудник</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Кабинет</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Устройства</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody>
              {ipAssignments
                .filter(ip => ip.assignedTo)
                .sort((a, b) => new Date(b.assignedDate || '').getTime() - new Date(a.assignedDate || '').getTime())
                .slice(0, 5)
                .map(ip => (
                  <tr key={ip.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono font-medium">{ip.ipAddress}</td>
                    <td className="py-2 px-3">{ip.assignedTo}</td>
                    <td className="py-2 px-3">{ip.room || '—'}</td>
                    <td className="py-2 px-3">{ip.devices.length}</td>
                    <td className="py-2 px-3 text-gray-500">{ip.assignedDate || '—'}</td>
                  </tr>
                ))}
              {ipAssignments.filter(ip => ip.assignedTo).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">Нет назначений</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
