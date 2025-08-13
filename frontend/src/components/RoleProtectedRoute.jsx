// src/components/RoleProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function RoleProtectedRoute({ children, allowedRole }) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.role !== allowedRole) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    } catch (error) {
      console.error('RoleProtectedRoute error:', error);
      setIsAuthorized(false);
      setIsLoading(false);
    }
  }, [allowedRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" />;
  }

  return children;
}
