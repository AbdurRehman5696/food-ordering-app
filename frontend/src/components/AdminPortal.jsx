import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';

export default function AdminPortal() {
  const { user, token } = useAuth();

  if (user?.role === 'admin' && token) {
    return <AdminDashboard />;
  }
  return <AdminLogin />;
}
