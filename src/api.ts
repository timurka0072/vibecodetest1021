// API клиент для работы с backend сервером
import { NetworkSettings, Employee, IPAssignment, DigitalSignature } from './types';

const API_BASE_URL = 'http://localhost:3001/api';

// ==================== NETWORKS ====================

export async function getNetworks(): Promise<NetworkSettings[]> {
  const response = await fetch(`${API_BASE_URL}/networks`);
  if (!response.ok) throw new Error('Failed to fetch networks');
  return response.json();
}

export async function createNetwork(network: NetworkSettings): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/networks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(network),
  });
  if (!response.ok) throw new Error('Failed to create network');
}

export async function updateNetwork(id: string, network: NetworkSettings): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/networks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(network),
  });
  if (!response.ok) throw new Error('Failed to update network');
}

export async function deleteNetwork(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/networks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete network');
}

// ==================== EMPLOYEES ====================

export async function getEmployees(): Promise<Employee[]> {
  const response = await fetch(`${API_BASE_URL}/employees`);
  if (!response.ok) throw new Error('Failed to fetch employees');
  return response.json();
}

export async function createEmployee(employee: Employee): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  if (!response.ok) throw new Error('Failed to create employee');
}

export async function updateEmployee(id: string, employee: Employee): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  if (!response.ok) throw new Error('Failed to update employee');
}

export async function deleteEmployee(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete employee');
}

// ==================== IP ASSIGNMENTS ====================

export async function getIPAssignments(): Promise<IPAssignment[]> {
  const response = await fetch(`${API_BASE_URL}/ip-assignments`);
  if (!response.ok) throw new Error('Failed to fetch IP assignments');
  return response.json();
}

export async function createIPAssignment(assignment: IPAssignment): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ip-assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignment),
  });
  if (!response.ok) throw new Error('Failed to create IP assignment');
}

export async function updateIPAssignment(id: string, assignment: IPAssignment): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ip-assignments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignment),
  });
  if (!response.ok) throw new Error('Failed to update IP assignment');
}

export async function deleteIPAssignment(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ip-assignments/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete IP assignment');
}

// ==================== DIGITAL SIGNATURES ====================

export async function getSignatures(): Promise<DigitalSignature[]> {
  const response = await fetch(`${API_BASE_URL}/signatures`);
  if (!response.ok) throw new Error('Failed to fetch signatures');
  return response.json();
}

export async function createSignature(signature: DigitalSignature): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/signatures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signature),
  });
  if (!response.ok) throw new Error('Failed to create signature');
}

export async function updateSignature(id: string, signature: DigitalSignature): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/signatures/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signature),
  });
  if (!response.ok) throw new Error('Failed to update signature');
}

export async function deleteSignature(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/signatures/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete signature');
}

// ==================== HEALTH CHECK ====================

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
