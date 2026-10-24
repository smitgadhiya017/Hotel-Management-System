import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, BedDouble, Users, LogIn, CreditCard,
  UserCog, BarChart3, Settings, X, ChevronLeft, ChevronRight, Hotel
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/reservations', icon: CalendarDays, label: 'Reservations' },
  { to: '/rooms', icon: BedDouble, label: 'Rooms' },
  { to: '/guests', icon: Users, label: 'Guests' },
  { to: '/checkin', icon: LogIn, label: 'Check-in / Out' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/staff', icon: UserCog, label: 'Staff' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';
  const userName = user?.name || 'Administrator';
  const userRole = user?.role === 'Administrator' ? 'Hotel Administrator' : (user?.role || 'Hotel Staff');

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#172554]">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-white/10', collapsed && 'justify-center px-3')}>
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <Hotel className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-white font-bold text-base leading-tight">GrandStay</h1>
            <p className="text-blue-300 text-xs">Hotel Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4.5 h-4.5')} style={{ width: collapsed ? 20 : 18, height: collapsed ? 20 : 18 }} />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                  {label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile */}
      <div className={cn('p-3 border-t border-white/10', collapsed && 'flex justify-center')}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold" title={userName}>
            {userInitials}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{userName}</p>
              <p className="text-blue-300 text-xs truncate">{userRole}</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center w-full py-3 border-t border-white/10 text-blue-300 hover:text-white hover:bg-white/10 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : (
          <span className="flex items-center gap-2 text-xs">
            <ChevronLeft className="w-4 h-4" /> Collapse
          </span>
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 sidebar-transition h-screen sticky top-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-64 z-50 sidebar-transition">
            {sidebarContent}
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
