import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Globe,
  Shield,
  FileBarChart,
  Menu,
  X,
  Calendar,
  AlertTriangle,
  Server,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { IPAssignment, DigitalSignature, TabType, NetworkSettings } from './types';
import {
  getIPAssignments,
  saveIPAssignments,
  getDigitalSignatures,
  saveDigitalSignatures,
  getSignatureStatus,
  getNetworkSettings,
  saveNetworkSettings,
  generateIPPoolFromNetwork,
  generateId,
} from './store';
import Dashboard from './components/Dashboard';
import IPPool from './components/IPPool';
import Signatures from './components/Signatures';
import Reports from './components/Reports';
import SettingsPanel from './components/SettingsPanel';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [ipAssignments, setIPAssignments] = useState<IPAssignment[]>([]);
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [networks, setNetworks] = useState<NetworkSettings[]>([]);
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
    let ips = getIPAssignments();
    let sigs = getDigitalSignatures();
    sigs = sigs.map((s) => ({ ...s, status: getSignatureStatus(s.expiryDate) }));
    setNetworks(nets);
    setIPAssignments(ips);
    setSignatures(sigs);
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
    // Regenerate IP pool
    const allIPs: IPAssignment[] = [];
    updated.forEach((network) => {
      allIPs.push(...generateIPPoolFromNetwork(network));
    });
    // Preserve existing assignments
    const preservedIPs = allIPs.map((newIP) => {
      const existing = ipAssignments.find((ip) => ip.ipAddress === newIP.ipAddress);
      if (existing) {
        return existing;
      }
      return newIP;
    });
    setIPAssignments(preservedIPs);
    saveIPAssignments(preservedIPs);
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'dashboard', label: 'Панель управления', icon: <LayoutDashboard size={20} />, description: 'Обзор системы' },
    { key: 'ip-pool', label: 'Пул IP-адресов', icon: <Globe size={20} />, description: 'Управление адресами' },
    { key: 'devices', label: 'ЭЦП', icon: <Shield size={20} />, description: 'Электронные подписи' },
    { key: 'reports', label: 'Отчёты', icon: <FileBarChart size={20} />, description: 'Аналитика и экспорт' },
    { key: 'settings', label: 'Настройки', icon: <Settings size={20} />, description: 'Сети и параметры' },
  ];

  const usedIPs = ipAssignments.filter(
    (ip) => ip.assignments.length > 0 || ip.devices.length > 0
  ).length;
  const expiringSigs = signatures.filter((s) => s.status === 'expiring').length;
  const expiredSigs = signatures.filter((s) => s.status === 'expired').length;
  const totalIPs = ipAssignments.length;
  const usagePercent = totalIPs > 0 ? (usedIPs / totalIPs) * 100 : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-72 bg-white/80 backdrop-blur-xl border-r border-white/20 flex flex-col shadow-2xl flex-shrink-0 z-30"
          >
            <div className="p-6 border-b border-gray-100/50">
              <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
                <div className="relative">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Server className="text-white" size={22} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-800 text-lg leading-tight">IP Manager</h1>
                  <p className="text-xs text-gray-400 font-medium">Система учёта v2.0</p>
                </div>
              </motion.div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">Навигация</p>
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); if (isMobile) setSidebarOpen(false); }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group relative ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200/50'
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-800'
                  }`}
                >
                  <span className={`flex-shrink-0 ${activeTab === tab.key ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'} transition-colors`}>
                    {tab.icon}
                  </span>
                  <div className="flex-1 text-left">
                    <span className="font-medium block">{tab.label}</span>
                    <span className={`text-xs ${activeTab === tab.key ? 'text-white/70' : 'text-gray-400'}`}>{tab.description}</span>
                  </div>
                  {tab.key === 'devices' && (expiringSigs + expiredSigs) > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'} badge-animate`}>
                      {expiringSigs + expiredSigs}
                    </motion.span>
                  )}
                  {activeTab === tab.key && (
                    <motion.div layoutId="activeTab" className="absolute right-2">
                      <ChevronRight size={16} className="text-white/70" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-100/50">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-500">Заполненность</span>
                  <span className="text-sm font-bold gradient-text">{Math.round(usagePercent)}%</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${usagePercent}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">{usedIPs} из {totalIPs}</span>
                  <span className="text-xs text-green-500 font-medium">{totalIPs - usedIPs} свободно</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden" />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="glass border-b border-white/20 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              {sidebarOpen ? <X className="text-gray-500" size={20} /> : <Menu className="text-gray-500" size={20} />}
            </motion.button>
            <div>
              <motion.h2 key={activeTab} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="text-lg sm:text-xl font-bold text-gray-800">
                {tabs.find((t) => t.key === activeTab)?.label}
              </motion.h2>
              <p className="text-xs text-gray-400 hidden sm:block">{tabs.find((t) => t.key === activeTab)?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {(expiringSigs > 0 || expiredSigs > 0) && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative">
                <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span className="hidden sm:inline">
                    {expiringSigs > 0 && `${expiringSigs} истекают`}
                    {expiringSigs > 0 && expiredSigs > 0 && ' · '}
                    {expiredSigs > 0 && `${expiredSigs} просрочены`}
                  </span>
                  <span className="sm:hidden">{expiringSigs + expiredSigs}</span>
                </div>
              </motion.div>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">
                {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </motion.header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="page-transition">
              {activeTab === 'dashboard' && <Dashboard ipAssignments={ipAssignments} signatures={signatures} />}
              {activeTab === 'ip-pool' && <IPPool ipAssignments={ipAssignments} onUpdate={handleUpdateIPs} />}
              {activeTab === 'devices' && <Signatures signatures={signatures} onUpdate={handleUpdateSignatures} />}
              {activeTab === 'reports' && <Reports ipAssignments={ipAssignments} signatures={signatures} onUpdateIP={handleUpdateIPs} />}
              {activeTab === 'settings' && <SettingsPanel networks={networks} onUpdate={handleUpdateNetworks} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
