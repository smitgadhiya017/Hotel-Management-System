import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  BedDouble, Users, CalendarDays, TrendingUp, Plus, ArrowRight,
  LogIn, LogOut as LogOutIcon, Clock
} from 'lucide-react';
import { AppData } from '../hooks/useAppData';
import { KpiCard, ChartCard, StatusBadge, PageHeader, Btn } from '../components/shared';
import { formatCurrency, formatDate, getGreeting } from '../lib/utils';
import { MONTHLY_REVENUE_DATA } from '../data/mockData';

const OCCUPANCY_COLORS = ['#3B82F6', '#16A34A', '#D97706', '#DC2626'];

const RECENT_STATUS_COLORS: Record<string, string> = {
  'Confirmed': 'bg-blue-50 text-blue-700',
  'Checked In': 'bg-green-50 text-green-700',
  'Checked Out': 'bg-slate-50 text-slate-600',
  'Pending': 'bg-amber-50 text-amber-700',
  'Cancelled': 'bg-red-50 text-red-700',
};

export function Dashboard() {
  const appData = useOutletContext<AppData>();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '12m'>('12m');
  const { rooms, reservations, payments, guests, metrics } = appData;

  const today = new Date().toISOString().split('T')[0];
  const greeting = getGreeting();

  // Chart data based on time range
  const chartData = timeRange === '12m' ? MONTHLY_REVENUE_DATA :
    timeRange === '30d' ? MONTHLY_REVENUE_DATA.slice(-4).map((d, i) => ({
      ...d, month: `Week ${i + 1}`
    })) :
    MONTHLY_REVENUE_DATA.slice(-2).map((d, i) => ({
      ...d, month: `Day ${(i + 1) * 3 + 1}`
    }));

  const occupancyData = [
    { name: 'Occupied', value: metrics.occupiedRooms, color: '#3B82F6' },
    { name: 'Available', value: metrics.availableRooms, color: '#16A34A' },
    { name: 'Reserved', value: metrics.reservedRooms, color: '#D97706' },
    { name: 'Maintenance', value: metrics.maintenanceRooms, color: '#DC2626' },
  ];

  const recentReservations = [...reservations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const totalRevenue = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  const occupancyRate = metrics.totalRooms > 0 ? Math.round((metrics.occupiedRooms / metrics.totalRooms) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{value: number}>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>
          <p className="text-sm font-bold text-blue-600">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, Admin 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">Here's what's happening at GrandStay today.</p>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Btn onClick={() => navigate('/reservations')} size="md">
          <Plus className="w-4 h-4" /> New Reservation
        </Btn>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Rooms"
          value={metrics.totalRooms}
          icon={<BedDouble className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
          subtitle={`${occupancyRate}% occupancy rate`}
        />
        <KpiCard
          title="Available Rooms"
          value={metrics.availableRooms}
          icon={<BedDouble className="w-5 h-5" />}
          accent="bg-green-50 text-green-600"
          trend={{ value: 3, label: 'vs yesterday' }}
        />
        <KpiCard
          title="Occupied Rooms"
          value={metrics.occupiedRooms}
          icon={<Users className="w-5 h-5" />}
          accent="bg-purple-50 text-purple-600"
          subtitle={`${metrics.reservedRooms} reserved`}
        />
        <KpiCard
          title="Today's Revenue"
          value={metrics.todayRevenue > 0 ? formatCurrency(metrics.todayRevenue) : formatCurrency(4850)}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="bg-amber-50 text-amber-600"
          trend={{ value: 12, label: 'vs yesterday' }}
        />
      </div>

      {/* Revenue Chart + Occupancy Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Revenue Overview"
          subtitle="Monthly revenue performance"
          className="lg:col-span-2"
          action={
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {(['7d', '30d', '12m'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '12 Months'}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 4, fill: '#3B82F6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Room Occupancy" subtitle="Current status breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {occupancyData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Rooms']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {occupancyData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Today's Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Arrivals */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <LogIn className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Today's Arrivals</h3>
              <p className="text-xs text-slate-500">{metrics.todayArrivals.length} expected</p>
            </div>
          </div>
          {metrics.todayArrivals.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No arrivals today</p>
          ) : (
            <div className="space-y-2">
              {metrics.todayArrivals.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-slate-800">{r.guestName}</p>
                    <p className="text-xs text-slate-500">Room {r.roomNumber}</p>
                  </div>
                  <StatusBadge status={r.bookingStatus} />
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/checkin')} className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 font-medium text-center py-1">
            View all →
          </button>
        </div>

        {/* Today's Departures */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <LogOutIcon className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Today's Departures</h3>
              <p className="text-xs text-slate-500">{metrics.todayDepartures.length} expected</p>
            </div>
          </div>
          {metrics.todayDepartures.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No departures today</p>
          ) : (
            <div className="space-y-2">
              {metrics.todayDepartures.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-slate-800">{r.guestName}</p>
                    <p className="text-xs text-slate-500">Room {r.roomNumber}</p>
                  </div>
                  <StatusBadge status={r.bookingStatus} />
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/checkin')} className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 font-medium text-center py-1">
            View all →
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'New Reservation', icon: CalendarDays, color: 'text-blue-600 bg-blue-50', to: '/reservations' },
              { label: 'Add Guest', icon: Users, color: 'text-green-600 bg-green-50', to: '/guests' },
              { label: 'Add Room', icon: BedDouble, color: 'text-purple-600 bg-purple-50', to: '/rooms' },
              { label: 'View Reports', icon: TrendingUp, color: 'text-amber-600 bg-amber-50', to: '/reports' },
            ].map(({ label, icon: Icon, color, to }) => (
              <button
                key={label}
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <div className={`p-1.5 rounded-lg ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reservations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Reservations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest booking activity</p>
          </div>
          <button onClick={() => navigate('/reservations')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Booking ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Guest</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Room</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Check-in</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Check-out</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentReservations.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{r.bookingId}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-800">{r.guestName}</p>
                    <p className="text-xs text-slate-500">{r.guestEmail}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <p className="text-slate-700">Room {r.roomNumber}</p>
                    <p className="text-xs text-slate-400">{r.roomType}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 hidden lg:table-cell">{formatDate(r.checkIn)}</td>
                  <td className="px-4 py-3.5 text-slate-600 hidden lg:table-cell">{formatDate(r.checkOut)}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-slate-800">{formatCurrency(r.totalAmount)}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={r.bookingStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
