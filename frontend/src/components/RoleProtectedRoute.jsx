// src/components/RoleProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

export default function RoleProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');

  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    if (decoded.role !== allowedRole) {
      return <Navigate to="/" />;
    }
  } catch {
    return <Navigate to="/login" />;
  }

  return children;
}
