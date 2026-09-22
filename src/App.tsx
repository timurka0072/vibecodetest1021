import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Globe, Shield, FileBarChart, Menu, X, Calendar, AlertTriangle, Server, ChevronRight, Settings, Users } from 'lucide-react';
import { IPAssignment, DigitalSignature, TabType, NetworkSettings, Employee } from './types';
import {
  getIPAssignments, saveIPAssignments,
  getDigitalSignatures, saveDigitalSignatures, getSignatureStatus,
  getNetworkSettings, saveNetworkSettings, generateIPPoolFromNetwork,
  getEmployees, saveEmployees,
} from './store';
import Dashboard from './components/Dashboard';
import IPPool from './components/IPPool';
import Employees from './components/Employees';
import Signatures from './components/Signatures';
import Reports from './components/Reports';
import SettingsPanel from './components/SettingsPanel';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [ipAssignments, setIPAssignments] = useState<IPAssignment[]>([]);
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [networks, setNetworks] = useState<NetworkSettings[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const nets = getNetworkSettings();
    const ips = getIPAssignments();
    const sigs = getDigitalSignatures().map((s) => ({ ...s, status: getSignatureStatus(s.expiryDate) }));
    const emps = getEmployees();
    setNetworks(nets);
    setIPAssignments(ips);
    setSignatures(sigs);
    setEmployees(emps);
  }, []);

  const handleUpdateIPs = (updated: IPAssignment[]) => {
    setIPAssignments(updated);
    saveIPAssignments(updated);
  };

  const handleUpdateSignatures = (updated: DigitalSignature[]) => {
    setSignatures(updated);
    saveDigitalSignatures(updated);
  };

  const handleUpdateNetworks = (updated: NetworkSettings[]) => {
    setNetworks(updated);
    saveNetworkSettings(updated);
    const allIPs: IPAssignment[] = [];
    updated.forEach((network) => {
      allIPs.push(...generateIPPoolFromNetwork(network));
    });
    const preservedIPs = allIPs.map((newIP) => {
      const existing = ipAssignments.find((ip) => ip.ipAddress === newIP.ipAddress);
      return existing || newIP;
    });
    setIPAssignments(preservedIPs);
    saveIPAssignments(preservedIPs);
  };

  const handleUpdateEmployees = (updated: Employee[]) => {
    setEmployees(updated);
    saveEmployees(updated);
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'dashboard', label: 'Панель управления', icon: <LayoutDashboard size={18} />, description: 'Обзор системы' },
    { key: 'ip-pool', label: 'Пул IP-адресов', icon: <Globe size={18} />, description: 'Управление адресами' },
    { key: 'employees', label: 'Сотрудники', icon: <Users size={18} />, description: 'Справочник' },
    { key: 'signatures', label: 'ЭЦП', icon: <Shield size={18} />, description: 'Электронные подписи' },
    { key: 'reports', label: 'Отчёты', icon: <FileBarChart size={18} />, description: 'Аналитика' },
    { key: 'settings', label: 'Настройки', icon: <Settings size={18} />, description: 'Сети' },
  ];

  const usedIPs = ipAssignments.filter((ip) => (ip.assignments?.length || 0) > 0 || (ip.devices?.length || 0) > 0).length;
  const expiringSigs = signatures.filter((s) => s.status === 'expiring').length;
  const expiredSigs = signatures.filter((s) => s.status === 'expired').length;
  const totalIPs = ipAssignments.length;
  const usagePercent = totalIPs > 0 ? (usedIPs / totalIPs) * 100 : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0 z-30"
          >
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Server className="text-white" size={18} />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900 text-sm">IP Manager</h1>
                  <p className="text-xs text-gray-500">Система учёта</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); if (isMobile) setSidebarOpen(false); }}
                  whileHover={{ x: 2 }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.key ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <div className="flex-1 text-left">
                    <span className="block">{tab.label}</span>
                    <span className="text-xs text-gray-400">{tab.description}</span>
                  </div>
                  {tab.key === 'signatures' && (expiringSigs + expiredSigs) > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                      {expiringSigs + expiredSigs}
                    </span>
                  )}
                </motion.button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-600">Заполненность</span>
                  <span className="font-semibold text-indigo-600">{Math.round(usagePercent)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${usagePercent}%` }} transition={{ duration: 1 }}
                    className="h-full bg-indigo-600 rounded-full" />
                </div>
                <div className="flex justify-between text-xs mt-1.5 text-gray-500">
                  <span>{usedIPs} из {totalIPs}</span>
                  <span className="text-green-600">{totalIPs - usedIPs} свободно</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/20 z-20 md:hidden" />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              {sidebarOpen ? <X className="text-gray-600" size={18} /> : <Menu className="text-gray-600" size={18} />}
            </motion.button>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{tabs.find((t) => t.key === activeTab)?.label}</h2>
              <p className="text-xs text-gray-500">{tabs.find((t) => t.key === activeTab)?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(expiringSigs > 0 || expiredSigs > 0) && (
              <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium flex items-center gap-1">
                <AlertTriangle size={12} />
                <span className="hidden sm:inline">{expiringSigs + expiredSigs} ЭЦП</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg">
              <Calendar size={12} className="text-gray-400" />
              <span className="text-xs text-gray-600">
                {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === 'dashboard' && <Dashboard ipAssignments={ipAssignments} signatures={signatures} employees={employees} />}
              {activeTab === 'ip-pool' && <IPPool ipAssignments={ipAssignments} employees={employees} onUpdate={handleUpdateIPs} />}
              {activeTab === 'employees' && <Employees employees={employees} onUpdate={handleUpdateEmployees} />}
              {activeTab === 'signatures' && <Signatures signatures={signatures} onUpdate={handleUpdateSignatures} />}
              {activeTab === 'reports' && <Reports ipAssignments={ipAssignments} signatures={signatures} employees={employees} onUpdateIP={handleUpdateIPs} />}
              {activeTab === 'settings' && <SettingsPanel networks={networks} onUpdate={handleUpdateNetworks} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
