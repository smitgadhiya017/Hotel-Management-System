import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, BarChart3 } from 'lucide-react';
import { AppData } from '../hooks/useAppData';
import { PageHeader, KpiCard, ChartCard, Btn } from '../components/shared';
import { formatCurrency, exportToCSV } from '../lib/utils';
import { MONTHLY_REVENUE_DATA } from '../data/mockData';

const PIE_COLORS = ['#3B82F6', '#16A34A', '#D97706', '#DC2626', '#8B5CF6'];

export function Reports() {
  const { reservations, payments, rooms, guests } = useOutletContext<AppData>();
  const [dateRange, setDateRange] = useState<'3m' | '6m' | '12m'>('12m');

  const months = dateRange === '3m' ? 3 : dateRange === '6m' ? 6 : 12;
  const revenueData = MONTHLY_REVENUE_DATA.slice(-months);

  const totalRevenue = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  const avgBookingValue = reservations.length ? (reservations.reduce((s, r) => s + Number(r.totalAmount || 0), 0) / reservations.length) : 0;
  const occupancyRate = rooms.length ? Math.round((rooms.filter(r => r.status === 'Occupied').length / rooms.length) * 100) : 0;
  const bookingCount = reservations.length;

  const statusData = [
    { name: 'Confirmed', value: reservations.filter(r => r.bookingStatus === 'Confirmed').length },
    { name: 'Checked In', value: reservations.filter(r => r.bookingStatus === 'Checked In').length },
    { name: 'Checked Out', value: reservations.filter(r => r.bookingStatus === 'Checked Out').length },
    { name: 'Pending', value: reservations.filter(r => r.bookingStatus === 'Pending').length },
    { name: 'Cancelled', value: reservations.filter(r => r.bookingStatus === 'Cancelled').length },
  ].filter(d => d.value > 0);

  const roomTypeData = ['Standard', 'Deluxe', 'Suite', 'Family'].map(type => ({
    type,
    count: rooms.filter(r => r.type === type).length,
    bookings: reservations.filter(r => r.roomType === type).length,
  }));

  const paymentMethodData = [
    { name: 'Card', value: payments.filter(p => p.method === 'Card').length },
    { name: 'Cash', value: payments.filter(p => p.method === 'Cash').length },
    { name: 'Bank Transfer', value: payments.filter(p => p.method === 'Bank Transfer').length },
  ].filter(d => d.value > 0);

  function handleExportRevenue() {
    exportToCSV(revenueData.map(d => ({ Month: d.month, Revenue: d.revenue, 'Occupancy %': d.occupancy })), 'revenue_report');
    toast_simple('Revenue report exported');
  }

  function handleExportReservations() {
    exportToCSV(reservations.map(r => ({
      'Booking ID': r.bookingId, Guest: r.guestName, Room: r.roomNumber, 'Check-in': r.checkIn,
      'Check-out': r.checkOut, Nights: r.nights, Amount: r.totalAmount, Status: r.bookingStatus
    })), 'reservations_report');
    toast_simple('Reservations report exported');
  }

  function toast_simple(msg: string) {
    // Simple toast
    const div = document.createElement('div');
    div.textContent = msg;
    div.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#172554;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;z-index:9999;animation:fadeIn 0.2s';
    document.body.appendChild(div);
    setTimeout(() => document.body.removeChild(div), 2500);
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm font-bold" style={{ color: p.name === 'revenue' ? '#3B82F6' : '#16A34A' }}>
              {p.name === 'revenue' ? formatCurrency(p.value) : `${p.value}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive overview of hotel performance and metrics.">
        <div className="flex gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {(['3m', '6m', '12m'] as const).map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${dateRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >{r === '3m' ? '3 Months' : r === '6m' ? '6 Months' : '12 Months'}</button>
            ))}
          </div>
          <Btn variant="secondary" size="sm" onClick={handleExportRevenue}><Download className="w-4 h-4" /> Export</Btn>
        </div>
      </PageHeader>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Bookings" value={bookingCount} icon={<BarChart3 className="w-5 h-5" />} accent="bg-blue-50 text-blue-600" />
        <KpiCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<BarChart3 className="w-5 h-5" />} accent="bg-green-50 text-green-600" />
        <KpiCard title="Avg. Occupancy" value={`${occupancyRate}%`} icon={<BarChart3 className="w-5 h-5" />} accent="bg-purple-50 text-purple-600" />
        <KpiCard title="Avg. Booking Value" value={formatCurrency(Math.round(avgBookingValue))} icon={<BarChart3 className="w-5 h-5" />} accent="bg-amber-50 text-amber-600" />
      </div>

      {/* Revenue + Occupancy Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Monthly Revenue" subtitle={`Last ${months} months`}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Occupancy Trend" subtitle="Monthly occupancy rate (%)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'Occupancy']} />
              <Line type="monotone" dataKey="occupancy" stroke="#16A34A" strokeWidth={2.5} dot={{ fill: '#16A34A', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Status + Room Type + Payment Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Reservation Status">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={2} stroke="#fff">
                {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Reservations']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Popular Room Types" subtitle="Bookings by room type">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={roomTypeData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v) => [v, 'Bookings']} />
              <Bar dataKey="bookings" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Methods">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentMethodData} cx="50%" cy="50%" outerRadius={80} dataKey="value" strokeWidth={2} stroke="#fff">
                {paymentMethodData.map((_, i) => <Cell key={i} fill={['#3B82F6', '#16A34A', '#8B5CF6'][i % 3]} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Transactions']} />
              <Legend formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Export Reports</h3>
        <div className="flex flex-wrap gap-3">
          <Btn variant="secondary" onClick={handleExportRevenue}>
            <Download className="w-4 h-4" /> Revenue Report (CSV)
          </Btn>
          <Btn variant="secondary" onClick={handleExportReservations}>
            <Download className="w-4 h-4" /> Reservations Report (CSV)
          </Btn>
        </div>
      </div>
    </div>
  );
}
