import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { LogIn, LogOut as LogOutIcon, Search, CheckCircle } from 'lucide-react';
import { AppData } from '../hooks/useAppData';
import { Reservation } from '../types';
import { PageHeader, StatusBadge, SearchInput, ConfirmDialog, Modal, Btn } from '../components/shared';
import { formatDate, formatCurrency, getTodayString } from '../lib/utils';
import { toast } from 'sonner';

export function CheckInOut() {
  const { reservations, rooms, updateReservation, updateRoom } = useOutletContext<AppData>();
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures'>('arrivals');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [checkinTarget, setCheckinTarget] = useState<Reservation | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<Reservation | null>(null);

  const today = getTodayString();

  const arrivals = useMemo(() => {
    let data = reservations.filter(r => r.bookingStatus === 'Confirmed');
    if (search) data = data.filter(r => r.guestName.toLowerCase().includes(search.toLowerCase()) || r.bookingId.includes(search));
    if (dateFilter) data = data.filter(r => r.checkIn === dateFilter);
    return data.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  }, [reservations, search, dateFilter]);

  const departures = useMemo(() => {
    let data = reservations.filter(r => r.bookingStatus === 'Checked In');
    if (search) data = data.filter(r => r.guestName.toLowerCase().includes(search.toLowerCase()) || r.bookingId.includes(search));
    if (dateFilter) data = data.filter(r => r.checkOut === dateFilter);
    return data.sort((a, b) => a.checkOut.localeCompare(b.checkOut));
  }, [reservations, search, dateFilter]);

  function handleCheckIn(res: Reservation) {
    updateReservation({ ...res, bookingStatus: 'Checked In' });
    const room = rooms.find(r => r.id === res.roomId);
    if (room) updateRoom({ ...room, status: 'Occupied' });
    setCheckinTarget(null);
    toast.success(`✅ ${res.guestName} has been checked in to Room ${res.roomNumber}`);
  }

  function handleCheckOut(res: Reservation) {
    updateReservation({ ...res, bookingStatus: 'Checked Out' });
    const room = rooms.find(r => r.id === res.roomId);
    if (room) updateRoom({ ...room, status: 'Available' });
    setCheckoutTarget(null);
    toast.success(`🚪 ${res.guestName} has been checked out from Room ${res.roomNumber}`);
  }

  const TabBtn = ({ tab, label, count }: { tab: 'arrivals' | 'departures'; label: string; count: number }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
    >
      {label}
      <span className={`px-1.5 py-0.5 text-xs rounded-full font-semibold ${activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{count}</span>
    </button>
  );

  const data = activeTab === 'arrivals' ? arrivals : departures;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Check-in / Check-out" subtitle="Manage guest arrivals and departures from the front desk." />

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="flex border-b border-slate-200 px-4">
          <TabBtn tab="arrivals" label="Arrivals" count={arrivals.length} />
          <TabBtn tab="departures" label="Departures" count={departures.length} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by guest name or booking ID..." className="flex-1" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 w-full sm:w-44"
          />
          {dateFilter && <Btn variant="ghost" size="sm" onClick={() => setDateFilter('')}>Clear</Btn>}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {data.length === 0 ? (
            <div className="py-16 text-center">
              <div className={`inline-flex p-4 rounded-full mb-3 ${activeTab === 'arrivals' ? 'bg-green-50' : 'bg-amber-50'}`}>
                {activeTab === 'arrivals' ? <LogIn className="w-6 h-6 text-green-600" /> : <LogOutIcon className="w-6 h-6 text-amber-600" />}
              </div>
              <p className="text-slate-600 font-medium">No {activeTab === 'arrivals' ? 'arrivals' : 'departures'} found</p>
              <p className="text-sm text-slate-400 mt-1">
                {activeTab === 'arrivals' ? 'No confirmed reservations match your filters.' : 'No checked-in guests match your filters.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                {activeTab === 'arrivals' ? (
                  <>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Guest</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Booking ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Room</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Check-in</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Check-out</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                  </>
                ) : (
                  <>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Guest</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Room</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Check-out</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Charges</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                  </>
                )}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {data.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    {activeTab === 'arrivals' ? (
                      <>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">{r.guestName}</p>
                          <p className="text-xs text-slate-500">{r.guestPhone}</p>
                        </td>
                        <td className="px-4 py-3.5"><span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{r.bookingId}</span></td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-700">Room {r.roomNumber}</p>
                          <p className="text-xs text-slate-400">{r.roomType}</p>
                        </td>
                        <td className={`px-4 py-3.5 font-medium ${r.checkIn === today ? 'text-green-600' : 'text-slate-600'}`}>{formatDate(r.checkIn)}</td>
                        <td className="px-4 py-3.5 text-slate-600">{formatDate(r.checkOut)}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={r.bookingStatus} /></td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setCheckinTarget(r)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <LogIn className="w-3.5 h-3.5" /> Check In
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">{r.guestName}</p>
                          <p className="text-xs text-slate-500">{r.guestPhone}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-700">Room {r.roomNumber}</p>
                          <p className="text-xs text-slate-400">{r.roomType}</p>
                        </td>
                        <td className={`px-4 py-3.5 font-medium ${r.checkOut === today ? 'text-amber-600' : 'text-slate-600'}`}>{formatDate(r.checkOut)}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{formatCurrency(r.totalAmount)}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={r.paymentStatus} /></td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setCheckoutTarget(r)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
                          >
                            <LogOutIcon className="w-3.5 h-3.5" /> Check Out
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Check-in Confirm */}
      {checkinTarget && (
        <Modal open={!!checkinTarget} onClose={() => setCheckinTarget(null)} title="Confirm Check-in" maxWidth="max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">{checkinTarget.guestName}</p>
                <p className="text-sm text-green-700">Room {checkinTarget.roomNumber} · {checkinTarget.nights} nights</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Booking ID</span><span className="font-mono">{checkinTarget.bookingId}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Check-in</span><span>{formatDate(checkinTarget.checkIn)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Check-out</span><span>{formatDate(checkinTarget.checkOut)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total</span><span className="font-bold">{formatCurrency(checkinTarget.totalAmount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Payment</span><StatusBadge status={checkinTarget.paymentStatus} /></div>
            </div>
            <div className="flex justify-end gap-3">
              <Btn variant="secondary" onClick={() => setCheckinTarget(null)}>Cancel</Btn>
              <Btn onClick={() => handleCheckIn(checkinTarget)} className="bg-green-600 hover:bg-green-700">
                <LogIn className="w-4 h-4" /> Confirm Check-in
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Check-out Confirm */}
      {checkoutTarget && (
        <Modal open={!!checkoutTarget} onClose={() => setCheckoutTarget(null)} title="Confirm Check-out" maxWidth="max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 mb-4">
              <LogOutIcon className="w-8 h-8 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">{checkoutTarget.guestName}</p>
                <p className="text-sm text-amber-700">Room {checkoutTarget.roomNumber}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Booking ID</span><span className="font-mono">{checkoutTarget.bookingId}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Check-in</span><span>{formatDate(checkoutTarget.checkIn)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Check-out</span><span>{formatDate(checkoutTarget.checkOut)}</span></div>
              <div className="flex justify-between text-sm font-semibold text-slate-800 border-t border-slate-100 pt-2"><span>Total Charges</span><span>{formatCurrency(checkoutTarget.totalAmount)}</span></div>
              {checkoutTarget.paymentStatus !== 'Paid' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">⚠️ Outstanding Payment</p>
                  <p className="text-xs text-red-600 mt-0.5">Payment status: {checkoutTarget.paymentStatus}. Please collect payment before proceeding.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Btn variant="secondary" onClick={() => setCheckoutTarget(null)}>Cancel</Btn>
              <Btn onClick={() => handleCheckOut(checkoutTarget)} className="bg-amber-600 hover:bg-amber-700">
                <LogOutIcon className="w-4 h-4" /> Confirm Check-out
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
