import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import DashboardOverview from './pages/DashboardOverview';
import Analytics from './pages/Analytics';
import Brands from './pages/Brands';
import Links from './pages/Links';
import Earnings from './pages/Earnings';
import Payments from './pages/Payments';
// Deleted legacy Admin.jsx and broken AdminDashboard.jsx files
import AdminDashboardSimple from './pages/AdminDashboardSimple';
import AdminApplications from './pages/AdminApplications';
import AdminTest from './pages/AdminTest';
import Onboarding from './pages/Onboarding';
import CreatorApplication from './pages/CreatorApplication';
import ApplicationPending from './pages/ApplicationPending';

import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Protected creator pages */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/application"
          element={<CreatorApplication />}
        />
        <Route
          path="/application/pending"
          element={
            <ProtectedRoute>
              <ApplicationPending />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brands"
          element={
            <ProtectedRoute>
              <Brands />
            </ProtectedRoute>
          }
        />
        <Route
          path="/links"
          element={
            <ProtectedRoute>
              <Links />
            </ProtectedRoute>
          }
        />
        <Route
          path="/earnings"
          element={
            <ProtectedRoute>
              <Earnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />

        {/* Protected admin dashboard with role check */}
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRole="ADMIN">
              <AdminDashboardSimple />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/test"
          element={
            <RoleProtectedRoute allowedRole="ADMIN">
              <AdminTest />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <RoleProtectedRoute allowedRole="ADMIN">
              <AdminApplications />
            </RoleProtectedRoute>
          }
        />
      </Routes>

      {/* Global toast container with dark theme */}
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </BrowserRouter>
  );
}
