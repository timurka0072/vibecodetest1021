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
  assignedTo?: string; // employee name
  assignedDate?: string;
  notes?: string;
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

export type TabType = 'dashboard' | 'ip-pool' | 'devices' | 'signatures' | 'reports';
