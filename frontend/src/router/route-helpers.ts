import type { AuthRole } from '@/setup/auth/authContext';

export const getDefaultAppPath = (role?: AuthRole | null) => {
  if (role === 'admin') {
    return '/app/admin/dashboard';
  }

  return '/app/teacher/dashboard';
};
