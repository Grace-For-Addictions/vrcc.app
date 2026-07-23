// src/components/shared/RoleGuard.jsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

export function RoleGuard({ allow, children }) {
  const { profile, loading } = useAuthStore();
  if (loading) return <div className="p-8 text-moss-300" role="status">Growing the network…</div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (!allow.includes(profile.role)) return <Navigate to="/" replace />;
  return children;
}
