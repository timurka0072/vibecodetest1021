import React, { useState, useEffect } from 'react';
import { IPAssignment, DigitalSignature, TabType } from './types';
import { getIPAssignments, saveIPAssignments, getDigitalSignatures, saveDigitalSignatures, getSignatureStatus } from './store';
import Dashboard from './components/Dashboard';
import IPPool from './components/IPPool';
import Signatures from './components/Signatures';
import Reports from './components/Reports';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [ipAssignments, setIPAssignments] = useState<IPAssignment[]>([]);
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Load data
    let ips = getIPAssignments();
    let sigs = getDigitalSignatures();

    // Update signature statuses
    sigs = sigs.map(s => ({ ...s, status: getSignatureStatus(s.expiryDate) }));

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

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Панель управления', icon: '📊' },
    { key: 'ip-pool', label: 'Пул IP-адресов', icon: '🌐' },
    { key: 'devices', label: 'ЭЦП', icon: '🔐' },
    { key: 'reports', label: 'Отчёты', icon: '📋' },
  ];

  const usedIPs = ipAssignments.filter(ip => ip.assignedTo || ip.devices.length > 0).length;
  const expiringSigs = signatures.filter(s => s.status === 'expiring').length;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">IP</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800 text-sm leading-tight">IP Manager</h1>
                <p className="text-xs text-gray-400">Учёт адресов</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <span className="text-lg flex-shrink-0">{tab.icon}</span>
              {sidebarOpen && <span>{tab.label}</span>}
              {sidebarOpen && tab.key === 'devices' && expiringSigs > 0 && (
                <span className="ml-auto px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                  {expiringSigs}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Stats Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-100">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">IP использовано</span>
                <span className="font-medium text-gray-700">{usedIPs}/{ipAssignments.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${ipAssignments.length > 0 ? (usedIPs / ipAssignments.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {tabs.find(t => t.key === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {expiringSigs > 0 && (
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium flex items-center gap-1">
                ⚠️ {expiringSigs} ЭЦП истекают
              </span>
            )}
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <Dashboard ipAssignments={ipAssignments} signatures={signatures} />
          )}
          {activeTab === 'ip-pool' && (
            <IPPool ipAssignments={ipAssignments} onUpdate={handleUpdateIPs} />
          )}
          {activeTab === 'devices' && (
            <Signatures signatures={signatures} onUpdate={handleUpdateSignatures} />
          )}
          {activeTab === 'reports' && (
            <Reports ipAssignments={ipAssignments} signatures={signatures} onUpdateIP={handleUpdateIPs} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
