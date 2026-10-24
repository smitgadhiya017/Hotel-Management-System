import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AppData } from '../../hooks/useAppData';

interface LayoutProps {
  appData: AppData;
}

export function Layout({ appData }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          notifications={appData.notifications}
          onMarkAllRead={appData.markAllRead}
          onMarkRead={appData.markRead}
          rooms={appData.rooms}
          guests={appData.guests}
          reservations={appData.reservations}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
            <Outlet context={appData} />
          </div>
        </main>
      </div>
    </div>
  );
}
