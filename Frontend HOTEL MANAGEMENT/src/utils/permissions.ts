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
  ],
  receptionist: [
    '/',
    '/rooms',
    '/guests',
    '/reservations',
    '/search',
  ],
  housekeeping: [
    '/',
    '/rooms',
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
