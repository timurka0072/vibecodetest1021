export type DeviceType = 'laptop' | 'desktop' | 'printer' | 'mfp' | 'other';

export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  inventoryNumber?: string;
  macAddress?: string;
}

export interface IPAssignment {
  id: string;
  ipAddress: string;
  subnet?: string;
  room?: string;
  devices: Device[];
  assignments: EmployeeAssignment[]; // Массив назначений для нескольких сотрудников
  notes?: string;
}

export interface EmployeeAssignment {
  id: string;
  employeeName: string;
  assignedDate: string;
  devices: Device[]; // Устройства конкретного сотрудника
}

export interface Employee {
  id: string;
  fullName: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
}

export interface DigitalSignature {
  id: string;
  employeeId: string;
  employeeName: string;
  issuer: string;
  serialNumber: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expiring' | 'expired';
}

export interface NetworkSettings {
  id: string;
  name: string;
  networkAddress: string;
  subnetMask: string;
  startIP: number;
  endIP: number;
}

export type TabType = 'dashboard' | 'ip-pool' | 'devices' | 'signatures' | 'reports' | 'settings';
