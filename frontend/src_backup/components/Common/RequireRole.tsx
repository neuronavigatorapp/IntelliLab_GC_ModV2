import React from 'react';
import type { UserRole } from '../../types/security';

interface RequireRoleProps {
  role: UserRole | UserRole[];
  userRole?: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ role, userRole = 'viewer', children, fallback = null }) => {
  const allowed = Array.isArray(role) ? role.includes(userRole) : userRole === role || (userRole === 'admin');
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
};

export default RequireRole;


