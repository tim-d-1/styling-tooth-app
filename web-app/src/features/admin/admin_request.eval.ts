import { describe, it, expect } from 'vitest';
import { calculateMetrics } from './admin_service';
import type { AppointmentRequest } from './admin_types';
import type { UserRole } from '@/features/auth/auth_types';

function checkRolePrivileges(role: UserRole) {
  const isClient = role === 'client';
  const isMaster = role === 'master';
  const isReceptionist = role === 'receptionist';
  const isAdmin = role === 'admin';
  const isStaff = isMaster || isReceptionist || isAdmin;
  const canManageAppointments = isReceptionist || isAdmin;

  return {
    isClient,
    isMaster,
    isReceptionist,
    isAdmin,
    isStaff,
    canManageAppointments,
  };
}

function isValidStatusTransition(
  currentStatus: string,
  targetStatus: string,
  isStaff: boolean
): boolean {
  if (currentStatus === targetStatus) return true;

  if (!isStaff) {
    if (targetStatus !== 'cancelled') return false;
    return currentStatus === 'new' || currentStatus === 'confirmed';
  }

  switch (currentStatus) {
    case 'new':
      return ['confirmed', 'in_progress', 'cancelled'].includes(targetStatus);
    case 'confirmed':
      return ['in_progress', 'cancelled', 'late', 'no_show'].includes(targetStatus);
    case 'in_progress':
      return ['completed', 'cancelled'].includes(targetStatus);
    default:
      return false;
  }
}

describe('Admin and Role System Eval Suite', () => {
  it('correctly calculates metrics for empty requests list', () => {
    const metrics = calculateMetrics([]);
    expect(metrics).toEqual({
      newCount: 0,
      inProgressCount: 0,
      completedCount: 0,
      todayRevenue: 0,
    });
  });

  it('correctly aggregates multi-status requests and revenue', () => {
    const today = new Date().toISOString();
    const requests: AppointmentRequest[] = [
      {
        id: '1',
        appointmentNumber: '#1001',
        status: 'new',
        startsAt: today,
        endsAt: today,
        price: 1000,
        client: { id: 'c1', fullName: 'User 1', phone: '+380501112233' },
        pet: { id: 'p1', name: 'Pet 1', breed: 'Dog', species: 'dog' },
        service: { id: 's1', name: 'Service 1', price: 1000 },
        master: null,
        createdAt: today,
      },
      {
        id: '2',
        appointmentNumber: '#1002',
        status: 'confirmed',
        startsAt: today,
        endsAt: today,
        price: 1500,
        client: { id: 'c2', fullName: 'User 2', phone: '+380502223344' },
        pet: { id: 'p2', name: 'Pet 2', breed: 'Cat', species: 'cat' },
        service: { id: 's2', name: 'Service 2', price: 1500 },
        master: { id: 'm1', displayName: 'Master 1' },
        createdAt: today,
      },
      {
        id: '3',
        appointmentNumber: '#1003',
        status: 'completed',
        startsAt: today,
        endsAt: today,
        price: 800,
        client: { id: 'c3', fullName: 'User 3', phone: '+380503334455' },
        pet: { id: 'p3', name: 'Pet 3', breed: 'Dog', species: 'dog' },
        service: { id: 's3', name: 'Service 3', price: 800 },
        master: { id: 'm2', displayName: 'Master 2' },
        createdAt: today,
      },
      {
        id: '4',
        appointmentNumber: '#1004',
        status: 'cancelled',
        startsAt: today,
        endsAt: today,
        price: 2000,
        client: { id: 'c4', fullName: 'User 4', phone: '+380504445566' },
        pet: { id: 'p4', name: 'Pet 4', breed: 'Dog', species: 'dog' },
        service: { id: 's4', name: 'Service 4', price: 2000 },
        master: null,
        createdAt: today,
      },
    ];

    const metrics = calculateMetrics(requests);
    expect(metrics.newCount).toBe(1);
    expect(metrics.inProgressCount).toBe(1);
    expect(metrics.completedCount).toBe(1);
    expect(metrics.todayRevenue).toBe(2300);
  });

  it('validates user role boundaries according to database rules', () => {
    const client = checkRolePrivileges('client');
    expect(client.isClient).toBe(true);
    expect(client.isStaff).toBe(false);
    expect(client.canManageAppointments).toBe(false);

    const master = checkRolePrivileges('master');
    expect(master.isMaster).toBe(true);
    expect(master.isStaff).toBe(true);
    expect(master.canManageAppointments).toBe(false);

    const receptionist = checkRolePrivileges('receptionist');
    expect(receptionist.isReceptionist).toBe(true);
    expect(receptionist.isStaff).toBe(true);
    expect(receptionist.isAdmin).toBe(false);
    expect(receptionist.canManageAppointments).toBe(true);

    const admin = checkRolePrivileges('admin');
    expect(admin.isAdmin).toBe(true);
    expect(admin.isStaff).toBe(true);
    expect(admin.canManageAppointments).toBe(true);
  });

  it('enforces status machine transitions per database migration 0014', () => {
    expect(isValidStatusTransition('new', 'confirmed', true)).toBe(true);
    expect(isValidStatusTransition('new', 'cancelled', true)).toBe(true);
    expect(isValidStatusTransition('confirmed', 'in_progress', true)).toBe(true);
    expect(isValidStatusTransition('in_progress', 'completed', true)).toBe(true);

    expect(isValidStatusTransition('new', 'confirmed', false)).toBe(false);
    expect(isValidStatusTransition('confirmed', 'in_progress', false)).toBe(false);
    expect(isValidStatusTransition('confirmed', 'cancelled', false)).toBe(true);
    expect(isValidStatusTransition('completed', 'cancelled', false)).toBe(false);
    expect(isValidStatusTransition('completed', 'in_progress', true)).toBe(false);
  });
});
