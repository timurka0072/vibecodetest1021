import { IPAssignment, DigitalSignature } from './types';

const IP_STORAGE_KEY = 'ip_assignments';
const SIGNATURES_STORAGE_KEY = 'digital_signatures';

// Generate initial IP pool
export function generateInitialIPPool(): IPAssignment[] {
  const assignments: IPAssignment[] = [];
  // Generate IPs from 192.168.1.1 to 192.168.1.254
  for (let i = 1; i <= 254; i++) {
    assignments.push({
      id: `ip-${i}`,
      ipAddress: `192.168.1.${i}`,
      subnet: '192.168.1.0/24',
      devices: [],
    });
  }
  return assignments;
}

export function getIPAssignments(): IPAssignment[] {
  const data = localStorage.getItem(IP_STORAGE_KEY);
  if (!data) {
    const initial = generateInitialIPPool();
    localStorage.setItem(IP_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
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

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
