import { StaffRole } from '../types';

// Her rol için erişilebilir sayfalar
export const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  manager: [
    '/',
    '/rooms',
    '/staff',
    '/guests',
    '/reservations',
    '/maintenance',
    '/room-service',
    '/inventory',
    '/search',
    '/ai-assistant',
    '/payments',
    '/invoices',
    '/reports',
    '/rate-plans',
    '/audit-log',
    '/guest-crm',
    '/dynamic-pricing',
    '/loyalty',
    '/surveys',
    '/pos',
    '/housekeeping',
  ],
  receptionist: [
    '/',
    '/rooms',
    '/guests',
    '/reservations',
    '/search',
    '/payments',
    '/invoices',
    '/guest-crm',
    '/loyalty',
    '/surveys',
    '/pos',
    '/housekeeping',
  ],
  housekeeping: [
    '/',
    '/rooms',
    '/housekeeping',
  ],
  maintenance: [
    '/',
    '/rooms',
    '/maintenance',
  ],
  'room-service': [
    '/',
    '/room-service',
    '/inventory',
    '/pos',
  ],
  customer: [
    '/',
    '/my-room-service',
    '/my-maintenance',
  ],
};

export const canAccessRoute = (role: StaffRole, path: string): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(path);
};

export const getAccessibleRoutes = (role: StaffRole): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  manager: 'Yönetici',
  receptionist: 'Resepsiyonist',
  housekeeping: 'Temizlik Personeli',
  maintenance: 'Teknisyen',
  'room-service': 'Oda Servisi/Mutfak',
  customer: 'Müşteri',
};
