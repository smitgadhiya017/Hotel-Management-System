import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAppData } from './hooks/useAppData';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';

// Page components
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Rooms } from './pages/Rooms';
import { Reservations } from './pages/Reservations';
import { Guests } from './pages/Guests';
import { CheckInOut } from './pages/CheckInOut';
import { Payments } from './pages/Payments';
import { Staff } from './pages/Staff';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export default function App() {
  const appData = useAppData();

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Hotel Management Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout appData={appData} />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/checkin" element={<CheckInOut />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

