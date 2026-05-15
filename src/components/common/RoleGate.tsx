import * as React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'ACCOUNTANT' | 'CLIENT';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallbackPath?: string;
}

/**
 * Role-Based Access Control Gate
 * Protects routes and UI elements based on user identity claims.
 */
export function RoleGate({ children, allowedRoles, fallbackPath = '/' }: RoleGateProps) {
  const { profile, loading } = useAuthStore();

  if (loading) return null;

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

/**
 * Component-level permission check
 */
export function useHasPermission(allowedRoles: Role[]) {
  const { profile } = useAuthStore();
  return profile ? allowedRoles.includes(profile.role) : false;
}
