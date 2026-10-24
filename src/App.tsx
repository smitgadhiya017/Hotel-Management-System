import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAppData } from './hooks/useAppData';
import { Layout } from './components/layout/Layout';

// Page components
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
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route element={<Layout appData={appData} />}>
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
    </BrowserRouter>
  );
}
