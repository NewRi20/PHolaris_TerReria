import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { AuthRole } from '@/setup/auth/authContext';
import { getDefaultAppPath } from './route-helpers';

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
    Authenticating session...
  </div>
);

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    if (user?.role === 'teacher' && !user.onboarding_complete) {
      return <Navigate to="/onboarding/1" replace />;
    }

    return <Navigate to={getDefaultAppPath(user?.role)} replace />;
  }

  return <Outlet />;
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  const needsOnboarding = user?.role === 'teacher' && !user.onboarding_complete;

  if (needsOnboarding && !isOnboardingRoute) {
    return <Navigate to="/onboarding/1" replace />;
  }

  if (!needsOnboarding && isOnboardingRoute) {
    return <Navigate to={getDefaultAppPath(user?.role)} replace />;
  }

  return <Outlet />;
}

export function AppHomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'teacher' && !user.onboarding_complete) {
    return <Navigate to="/onboarding/1" replace />;
  }

  return <Navigate to={getDefaultAppPath(user.role)} replace />;
}

interface RoleProtectedRouteProps {
  allowedRoles: AuthRole[];
}

export function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultAppPath(user.role)} replace />;
  }

  return <Outlet />;
}
