import { IPAssignment, DigitalSignature, NetworkSettings, Employee } from './types';

const IP_STORAGE_KEY = 'ip_assignments';
const SIGNATURES_STORAGE_KEY = 'digital_signatures';
const NETWORKS_STORAGE_KEY = 'network_settings';
const EMPLOYEES_STORAGE_KEY = 'employees';

// Generate IP pool from network settings
export function generateIPPoolFromNetwork(network: NetworkSettings): IPAssignment[] {
  const assignments: IPAssignment[] = [];
  const [a, b, c] = network.networkAddress.split('.').map(Number);
  
  for (let i = network.startIP; i <= network.endIP; i++) {
    assignments.push({
      id: `${network.id}-${i}`,
      ipAddress: `${a}.${b}.${c}.${i}`,
      subnet: `${network.networkAddress}/${network.subnetMask}`,
      devices: [],
      assignments: [],
    });
  }
  return assignments;
}

export function getNetworkSettings(): NetworkSettings[] {
  const data = localStorage.getItem(NETWORKS_STORAGE_KEY);
  if (!data) {
    const defaultNetwork: NetworkSettings = {
      id: 'default',
      name: 'Основная сеть',
      networkAddress: '192.168.1.0',
      subnetMask: '24',
      startIP: 1,
      endIP: 254,
    };
    localStorage.setItem(NETWORKS_STORAGE_KEY, JSON.stringify([defaultNetwork]));
    return [defaultNetwork];
  }
  return JSON.parse(data);
}

export function saveNetworkSettings(networks: NetworkSettings[]): void {
  localStorage.setItem(NETWORKS_STORAGE_KEY, JSON.stringify(networks));
}

export function getIPAssignments(): IPAssignment[] {
  const data = localStorage.getItem(IP_STORAGE_KEY);
  if (!data) {
    const networks = getNetworkSettings();
    const allIPs: IPAssignment[] = [];
    networks.forEach(network => {
      allIPs.push(...generateIPPoolFromNetwork(network));
    });
    localStorage.setItem(IP_STORAGE_KEY, JSON.stringify(allIPs));
    return allIPs;
  }
  
  const parsed = JSON.parse(data);
  
  // Миграция: гарантируем наличие всех полей
  const migrated = parsed.map((ip: any) => {
    // Если есть старое поле assignedTo, конвертируем
    if (ip.assignedTo && !ip.assignments) {
      return {
        ...ip,
        assignments: [{
          id: generateId(),
          employeeId: '',
          assignedDate: ip.assignedDate || new Date().toISOString().split('T')[0],
        }],
        devices: ip.devices || [],
      };
    }
    return {
      ...ip,
      assignments: (ip.assignments || []).map((a: any) => ({
        id: a.id || generateId(),
        employeeId: a.employeeId || '',
        assignedDate: a.assignedDate || new Date().toISOString().split('T')[0],
      })),
      devices: ip.devices || [],
    };
  });
  
  localStorage.setItem(IP_STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

export function saveIPAssignments(assignments: IPAssignment[]): void {
  localStorage.setItem(IP_STORAGE_KEY, JSON.stringify(assignments));
}

export function getDigitalSignatures(): DigitalSignature[] {
  const data = localStorage.getItem(SIGNATURES_STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export function saveDigitalSignatures(signatures: DigitalSignature[]): void {
  localStorage.setItem(SIGNATURES_STORAGE_KEY, JSON.stringify(signatures));
}

export function getSignatureStatus(expiryDate: string): 'active' | 'expiring' | 'expired' {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring';
  return 'active';
}

export function getEmployees(): Employee[] {
  const data = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export function saveEmployees(employees: Employee[]): void {
  localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
