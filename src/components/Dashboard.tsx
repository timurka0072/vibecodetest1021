import React from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  CheckCircle2,
  Clock,
  Monitor,
  TrendingUp,
  Building2,
  AlertTriangle,
  Shield,
  ArrowUpRight,
} from 'lucide-react';
import { IPAssignment, DigitalSignature } from '../types';

interface Props {
  ipAssignments: IPAssignment[];
  signatures: DigitalSignature[];
}

export default function Dashboard({ ipAssignments, signatures }: Props) {
  const totalIPs = ipAssignments.length;
  const usedIPs = ipAssignments.filter(
    (ip) => ip.assignedTo || ip.devices.length > 0
  ).length;
  const freeIPs = totalIPs - usedIPs;
  const usagePercent = Math.round((usedIPs / totalIPs) * 100);
  const totalDevices = ipAssignments.reduce(
    (sum, ip) => sum + ip.devices.length,
    0
  );
  const activeSignatures = signatures.filter((s) => s.status === 'active').length;
  const expiringSignatures = signatures.filter(
    (s) => s.status === 'expiring'
  ).length;
  const expiredSignatures = signatures.filter(
    (s) => s.status === 'expired'
  ).length;
  const rooms = [
    ...new Set(ipAssignments.filter((ip) => ip.room).map((ip) => ip.room)),
  ];

  const stats = [
    {
      label: 'Всего IP-адресов',
      value: totalIPs,
      icon: <Globe size={24} />,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      shadowColor: 'shadow-blue-200/50',
    },
    {
      label: 'Использовано',
      value: usedIPs,
      icon: <CheckCircle2 size={24} />,
      gradient: 'from-emerald-500 to-green-500',
      bgGradient: 'from-emerald-50 to-green-50',
      shadowColor: 'shadow-emerald-200/50',
    },
    {
      label: 'Свободно',
      value: freeIPs,
      icon: <Clock size={24} />,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50',
      shadowColor: 'shadow-amber-200/50',
    },
    {
      label: 'Устройств',
      value: totalDevices,
      icon: <Monitor size={24} />,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      shadowColor: 'shadow-purple-200/50',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-bold text-gray-800 mb-1">
          Добро пожаловать! 👋
        </h2>
        <p className="text-gray-500">
          Обзор состояния сети и ресурсов вашей организации
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`relative bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-5 border border-white/50 shadow-lg ${stat.shadowColor} overflow-hidden group cursor-default`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity">
              <div className={`w-full h-full bg-gradient-to-br ${stat.gradient} rounded-full blur-3xl`} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}
                >
                  {stat.icon}
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <TrendingUp size={16} className="text-gray-400" />
                </motion.div>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Usage Progress */}
      <motion.div
        variants={itemVariants}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Заполненность пула IP-адресов
              </h3>
              <p className="text-sm text-gray-500">
                Распределение адресного пространства
              </p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="text-4xl font-bold gradient-text"
            >
              {usagePercent}%
            </motion.div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className="text-gray-500">
              <span className="font-semibold text-green-600">{usedIPs}</span>{' '}
              использовано
            </span>
            <span className="text-gray-500">
              <span className="font-semibold text-amber-600">{freeIPs}</span>{' '}
              свободно
            </span>
          </div>
        </div>
      </motion.div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signatures Status */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200/50">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Статус ЭЦП
              </h3>
              <p className="text-xs text-gray-500">
                Электронные цифровые подписи
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100"
            >
              <span className="flex items-center gap-2 text-gray-700 font-medium">
                <span className="text-emerald-500"><CheckCircle2 size={16} /></span>
                Активные
              </span>
              <span className="text-lg font-bold text-emerald-600 bg-white px-3 py-1 rounded-lg shadow-sm">
                {activeSignatures}
              </span>
            </motion.div>
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100"
            >
              <span className="flex items-center gap-2 text-gray-700 font-medium">
                <span className="text-amber-500"><AlertTriangle size={16} /></span>
                Истекают (30 дней)
              </span>
              <span className="text-lg font-bold text-amber-600 bg-white px-3 py-1 rounded-lg shadow-sm">
                {expiringSignatures}
              </span>
            </motion.div>
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100"
            >
              <span className="flex items-center gap-2 text-gray-700 font-medium">
                <span className="text-red-500"><Clock size={16} /></span>
                Просрочены
              </span>
              <span className="text-lg font-bold text-red-600 bg-white px-3 py-1 rounded-lg shadow-sm">
                {expiredSignatures}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Rooms */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-200/50">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Занятые кабинеты
              </h3>
              <p className="text-xs text-gray-500">
                Распределение по помещениям
              </p>
            </div>
          </div>
          {rooms.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {rooms.sort().map((room, index) => (
                <motion.span
                  key={room}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-xl text-sm font-medium border border-indigo-100 cursor-default shadow-sm"
                >
                  Каб. {room}
                </motion.span>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2
                size={48}
                className="mx-auto text-gray-200 mb-2"
              />
              <p className="text-gray-400 text-sm">Нет данных о кабинетах</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Assignments */}
      <motion.div
        variants={itemVariants}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200/50">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Последние назначения
              </h3>
              <p className="text-xs text-gray-500">
                Недавно выданные IP-адреса
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  IP-адрес
                </th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  Сотрудник
                </th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  Кабинет
                </th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  Устройства
                </th>
                <th className="text-left py-3 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody>
              {ipAssignments
                .filter((ip) => ip.assignedTo)
                .sort(
                  (a, b) =>
                    new Date(b.assignedDate || '').getTime() -
                    new Date(a.assignedDate || '').getTime()
                )
                .slice(0, 5)
                .map((ip, index) => (
                  <motion.tr
                    key={ip.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-gray-50 table-row-hover"
                  >
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-mono text-xs font-semibold">
                        {ip.ipAddress}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {ip.assignedTo}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {ip.room ? (
                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs">
                          {ip.room}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                        {ip.devices.length} шт.
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {ip.assignedDate || '—'}
                    </td>
                  </motion.tr>
                ))}
              {ipAssignments.filter((ip) => ip.assignedTo).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-gray-400"
                  >
                    <Monitor
                      size={48}
                      className="mx-auto text-gray-200 mb-3"
                    />
                    <p>Нет назначений</p>
                    <p className="text-xs mt-1">
                      Перейдите в раздел «Пул IP-адресов» для начала работы
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
