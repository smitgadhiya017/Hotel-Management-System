import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, ChevronDown, LogOut, User, Settings, FileSpreadsheet, RefreshCw, Database } from 'lucide-react';
import { cn, timeAgo, formatDate } from '../../lib/utils';
import { Notification, Room, Guest, Reservation } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onMobileMenuOpen: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  isSyncing?: boolean;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  /*
  googleSheetsEnabled?: boolean;
  */
  supabaseEnabled?: boolean;
  googleSheetsEnabled?: boolean; // Kept for backwards compatibility
  onSyncClick?: () => void;
}

const NOTIF_ICONS: Record<string, string> = {
  reservation: '📋',
  checkin: '✅',
  checkout: '🚪',
  payment: '💳',
};

export function Topbar({
  onMobileMenuOpen, notifications, onMarkAllRead, onMarkRead, rooms, guests, reservations,
  isSyncing, syncStatus, googleSheetsEnabled, supabaseEnabled, onSyncClick
}: TopbarProps) {
  const isDbEnabled = supabaseEnabled ?? googleSheetsEnabled;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Search results
  const searchResults = searchQuery.length > 1 ? [
    ...guests.filter(g => `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3).map(g => ({ type: 'Guest', label: `${g.firstName} ${g.lastName}`, sub: g.email, to: '/guests' })),
    ...reservations.filter(r => r.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) || r.guestName.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3).map(r => ({ type: 'Booking', label: r.bookingId, sub: r.guestName, to: '/reservations' })),
    ...rooms.filter(r => r.roomNumber.includes(searchQuery) || r.type.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 2).map(r => ({ type: 'Room', label: `Room ${r.roomNumber}`, sub: `${r.type} · ${r.status}`, to: '/rooms' })),
  ] : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { user, logout } = useAuth();
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';
  const userName = user?.name || 'Administrator';
  const userRole = user?.role || 'Staff';
  const userEmail = user?.email || 'admin@grandstay.in';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Global Search */}
      <div ref={searchRef} className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search guests, bookings, rooms..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white placeholder:text-slate-400 transition-all"
          />
        </div>
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => { navigate(r.to); setSearchQuery(''); setSearchOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                  r.type === 'Guest' ? 'bg-blue-100 text-blue-700' :
                    r.type === 'Booking' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                )}>
                  {r.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r.label}</p>
                  <p className="text-xs text-slate-500 truncate">{r.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {searchOpen && searchQuery.length > 1 && searchResults.length === 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in text-center">
            <p className="text-sm text-slate-500">No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/*
        {/ * Google Sheets Live Sync Button * /}
        <button
          onClick={googleSheetsEnabled ? onSyncClick : () => navigate('/settings')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
            googleSheetsEnabled
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
          )}
          title={googleSheetsEnabled ? 'Google Sheets Live Sync (Click to refresh/pull data)' : 'Configure Google Sheets Live Database'}
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
          ) : (
            <FileSpreadsheet className={cn('w-3.5 h-3.5', googleSheetsEnabled ? 'text-emerald-600' : 'text-slate-400')} />
          )}
          <span className="hidden md:inline">
            {isSyncing ? 'Syncing...' : googleSheetsEnabled ? 'Google Sheet Synced' : 'Connect Sheet'}
          </span>
        </button>
        */}

        {/* Supabase PostgreSQL Live Database Sync Button */}
        <button
          onClick={isDbEnabled ? onSyncClick : () => navigate('/settings')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
            isDbEnabled
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
          )}
          title={isDbEnabled ? 'Supabase Live Database (Click to pull/refresh data)' : 'Configure Supabase Database'}
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
          ) : (
            <Database className={cn('w-3.5 h-3.5', isDbEnabled ? 'text-emerald-600' : 'text-slate-400')} />
          )}
          <span className="hidden md:inline">
            {isSyncing ? 'Syncing...' : isDbEnabled ? 'Supabase Synced' : 'Connect Supabase'}
          </span>
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={onMarkAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 text-center">No notifications</p>
                ) : notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => onMarkRead(n.id)}
                    className={cn('w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0',
                      !n.read && 'bg-blue-50/50'
                    )}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', n.read ? 'text-slate-700' : 'text-slate-900')}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{timeAgo(n.timestamp)}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#172554] flex items-center justify-center text-white text-xs font-bold">
                {userInitials}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-800 leading-tight">{userName}</p>
              <p className="text-xs text-slate-500">{userRole}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {userRole}
                </span>
              </div>
              <button
                onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button
                onClick={async () => {
                  setProfileOpen(false);
                  await logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
