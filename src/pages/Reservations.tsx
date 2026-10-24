import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { AppData } from '../hooks/useAppData';
import { Reservation, BookingStatus, RoomType } from '../types';
import {
  PageHeader, StatusBadge, KpiCard, SearchInput, SelectFilter,
  ConfirmDialog, Pagination, Modal, Btn, FormField, Input, Textarea, Select, EmptyState
} from '../components/shared';
import { formatCurrency, formatDate, calculateNights, generateId, generateBookingId, getTodayString } from '../lib/utils';
import { toast } from 'sonner';

const PAGE_SIZE = 8;
const STATUS_OPTIONS = [
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Checked In', label: 'Checked In' },
  { value: 'Checked Out', label: 'Checked Out' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Cancelled', label: 'Cancelled' },
];

interface ReservationFormData {
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  notes: string;
}

export function Reservations() {
  const appData = useOutletContext<AppData>();
  const { reservations, rooms, guests, addReservation, updateReservation, deleteReservation } = appData;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<keyof Reservation>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewRes, setViewRes] = useState<Reservation | null>(null);
  const [editRes, setEditRes] = useState<Reservation | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ReservationFormData>({
    guestId: '', guestName: '', guestEmail: '', guestPhone: '',
    roomId: '', checkIn: getTodayString(), checkOut: '', adults: 2, children: 0, notes: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ReservationFormData, string>>>({});

  const today = getTodayString();

  const filtered = useMemo(() => {
    let data = [...reservations];
    if (search) data = data.filter(r => r.bookingId.toLowerCase().includes(search.toLowerCase()) || r.guestName.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) data = data.filter(r => r.bookingStatus === statusFilter);
    data.sort((a, b) => {
      const va = String(a[sortCol] ?? '');
      const vb = String(b[sortCol] ?? '');
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return data;
  }, [reservations, search, statusFilter, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.bookingStatus === 'Confirmed').length,
    checkedIn: reservations.filter(r => r.bookingStatus === 'Checked In').length,
    pending: reservations.filter(r => r.bookingStatus === 'Pending').length,
  };

  function toggleSort(col: keyof Reservation) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  function SortIcon({ col }: { col: keyof Reservation }) {
    if (sortCol !== col) return <span className="text-slate-300 ml-1">↕</span>;
    return <span className="text-blue-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const selectedRoom = rooms.find(r => r.id === form.roomId);
  const nights = calculateNights(form.checkIn, form.checkOut);
  const totalAmount = selectedRoom ? selectedRoom.pricePerNight * nights : 0;

  function validateForm(): boolean {
    const errors: Partial<Record<keyof ReservationFormData, string>> = {};
    if (!form.guestName.trim()) errors.guestName = 'Guest name is required';
    if (!form.guestEmail.trim()) errors.guestEmail = 'Email is required';
    if (!form.roomId) errors.roomId = 'Please select a room';
    if (!form.checkIn) errors.checkIn = 'Check-in date is required';
    if (!form.checkOut) errors.checkOut = 'Check-out date is required';
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) errors.checkOut = 'Check-out must be after check-in';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openNew() {
    setEditRes(null);
    setForm({ guestId: '', guestName: '', guestEmail: '', guestPhone: '', roomId: '', checkIn: today, checkOut: '', adults: 2, children: 0, notes: '' });
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(res: Reservation) {
    setEditRes(res);
    setForm({
      guestId: res.guestId, guestName: res.guestName, guestEmail: res.guestEmail,
      guestPhone: res.guestPhone, roomId: res.roomId, checkIn: res.checkIn,
      checkOut: res.checkOut, adults: res.adults, children: res.children, notes: res.notes
    });
    setFormErrors({});
    setFormOpen(true);
  }

  function handleGuestSelect(guestId: string) {
    const g = guests.find(g => g.id === guestId);
    if (g) setForm(f => ({ ...f, guestId, guestName: `${g.firstName} ${g.lastName}`, guestEmail: g.email, guestPhone: g.phone }));
    else setForm(f => ({ ...f, guestId: '', guestName: '', guestEmail: '', guestPhone: '' }));
  }

  function handleSubmit() {
    if (!validateForm()) return;
    const room = rooms.find(r => r.id === form.roomId)!;
    if (editRes) {
      updateReservation({
        ...editRes,
        ...form,
        roomNumber: room.roomNumber,
        roomType: room.type as RoomType,
        pricePerNight: room.pricePerNight,
        nights,
        totalAmount,
      });
      toast.success('Reservation updated successfully');
    } else {
      const newRes: Reservation = {
        id: generateId('res'),
        bookingId: generateBookingId(),
        ...form,
        roomNumber: room.roomNumber,
        roomType: room.type as RoomType,
        pricePerNight: room.pricePerNight,
        nights,
        totalAmount,
        paymentStatus: 'Unpaid',
        bookingStatus: 'Confirmed',
        createdAt: new Date().toISOString(),
      };
      addReservation(newRes);
      toast.success(`Reservation ${newRes.bookingId} created successfully`);
    }
    setFormOpen(false);
  }

  function handleDelete() {
    if (deleteId) { deleteReservation(deleteId); toast.success('Reservation cancelled'); setDeleteId(null); }
  }

  const availableRooms = rooms.filter(r => r.status === 'Available' || (editRes && r.id === editRes.roomId));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reservations"
        subtitle="Manage bookings, guest stays, and reservation status."
      >
        <Btn onClick={openNew}>
          <Plus className="w-4 h-4" /> New Reservation
        </Btn>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Reservations" value={counts.total} icon={<CalendarDays className="w-5 h-5" />} accent="bg-blue-50 text-blue-600" />
        <KpiCard title="Confirmed" value={counts.confirmed} icon={<CalendarDays className="w-5 h-5" />} accent="bg-purple-50 text-purple-600" />
        <KpiCard title="Checked In" value={counts.checkedIn} icon={<CalendarDays className="w-5 h-5" />} accent="bg-green-50 text-green-600" />
        <KpiCard title="Pending" value={counts.pending} icon={<CalendarDays className="w-5 h-5" />} accent="bg-amber-50 text-amber-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by ID or guest name..." className="flex-1" />
          <SelectFilter
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setPage(1); }}
            options={STATUS_OPTIONS}
            placeholder="All Statuses"
            className="w-full sm:w-40"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {[
                  { label: 'Booking ID', col: 'bookingId' as keyof Reservation },
                  { label: 'Guest', col: 'guestName' as keyof Reservation },
                  { label: 'Room', col: 'roomNumber' as keyof Reservation },
                  { label: 'Check-in', col: 'checkIn' as keyof Reservation },
                  { label: 'Check-out', col: 'checkOut' as keyof Reservation },
                  { label: 'Amount', col: 'totalAmount' as keyof Reservation },
                  { label: 'Payment', col: 'paymentStatus' as keyof Reservation },
                  { label: 'Status', col: 'bookingStatus' as keyof Reservation },
                ].map(({ label, col }) => (
                  <th
                    key={col}
                    onClick={() => toggleSort(col)}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 select-none whitespace-nowrap"
                  >
                    {label}<SortIcon col={col} />
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.length === 0 ? (
                <tr><td colSpan={9} className="py-12"><EmptyState title="No reservations found" description="Try adjusting your search or filters" /></td></tr>
              ) : paged.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{r.bookingId}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-800 whitespace-nowrap">{r.guestName}</p>
                    <p className="text-xs text-slate-500">{r.guestEmail}</p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="text-slate-700">Room {r.roomNumber}</p>
                    <p className="text-xs text-slate-400">{r.roomType}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(r.checkIn)}</td>
                  <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(r.checkOut)}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{formatCurrency(r.totalAmount)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={r.paymentStatus} /></td>
                  <td className="px-4 py-3.5"><StatusBadge status={r.bookingStatus} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewRes(r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* View Dialog */}
      {viewRes && (
        <Modal open={!!viewRes} onClose={() => setViewRes(null)} title={`Reservation ${viewRes.bookingId}`} maxWidth="max-w-lg">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-500">Guest</p><p className="text-sm font-medium">{viewRes.guestName}</p></div>
              <div><p className="text-xs text-slate-500">Email</p><p className="text-sm">{viewRes.guestEmail}</p></div>
              <div><p className="text-xs text-slate-500">Room</p><p className="text-sm font-medium">Room {viewRes.roomNumber} ({viewRes.roomType})</p></div>
              <div><p className="text-xs text-slate-500">Guests</p><p className="text-sm">{viewRes.adults} adults, {viewRes.children} children</p></div>
              <div><p className="text-xs text-slate-500">Check-in</p><p className="text-sm">{formatDate(viewRes.checkIn)}</p></div>
              <div><p className="text-xs text-slate-500">Check-out</p><p className="text-sm">{formatDate(viewRes.checkOut)}</p></div>
              <div><p className="text-xs text-slate-500">Nights</p><p className="text-sm font-medium">{viewRes.nights}</p></div>
              <div><p className="text-xs text-slate-500">Price/Night</p><p className="text-sm">{formatCurrency(viewRes.pricePerNight)}</p></div>
              <div><p className="text-xs text-slate-500">Total Amount</p><p className="text-sm font-bold text-slate-900">{formatCurrency(viewRes.totalAmount)}</p></div>
              <div><p className="text-xs text-slate-500">Payment</p><StatusBadge status={viewRes.paymentStatus} /></div>
              <div><p className="text-xs text-slate-500">Status</p><StatusBadge status={viewRes.bookingStatus} /></div>
              <div><p className="text-xs text-slate-500">Booked on</p><p className="text-sm">{formatDate(viewRes.createdAt)}</p></div>
            </div>
            {viewRes.notes && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{viewRes.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Form Dialog */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editRes ? 'Edit Reservation' : 'New Reservation'} maxWidth="max-w-2xl">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Select Guest" className="sm:col-span-2">
              <Select value={form.guestId} onChange={e => handleGuestSelect(e.target.value)}>
                <option value="">— Choose existing guest —</option>
                {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
              </Select>
            </FormField>
            <FormField label="Guest Name" error={formErrors.guestName} required>
              <Input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} placeholder="Full name" />
            </FormField>
            <FormField label="Email" error={formErrors.guestEmail} required>
              <Input type="email" value={form.guestEmail} onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))} placeholder="email@example.com" />
            </FormField>
            <FormField label="Phone">
              <Input value={form.guestPhone} onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))} placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="Room" error={formErrors.roomId} required>
              <Select value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}>
                <option value="">— Select room —</option>
                {availableRooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber} — {r.type} (₹{r.pricePerNight.toLocaleString('en-IN')}/night)</option>)}
              </Select>
            </FormField>
            <FormField label="Check-in Date" error={formErrors.checkIn} required>
              <Input type="date" value={form.checkIn} min={today} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} />
            </FormField>
            <FormField label="Check-out Date" error={formErrors.checkOut} required>
              <Input type="date" value={form.checkOut} min={form.checkIn || today} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} />
            </FormField>
            <FormField label="Adults">
              <Input type="number" min={1} max={10} value={form.adults} onChange={e => setForm(f => ({ ...f, adults: +e.target.value }))} />
            </FormField>
            <FormField label="Children">
              <Input type="number" min={0} max={10} value={form.children} onChange={e => setForm(f => ({ ...f, children: +e.target.value }))} />
            </FormField>
            <FormField label="Notes" className="sm:col-span-2">
              <Textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special requests or notes..." />
            </FormField>
          </div>

          {selectedRoom && nights > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-2">Booking Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">{formatCurrency(selectedRoom.pricePerNight)}/night × {nights} nights</span>
                <span className="font-bold text-blue-900">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <Btn variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Btn>
          <Btn onClick={handleSubmit}>{editRes ? 'Save Changes' : 'Create Reservation'}</Btn>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this reservation? This action cannot be undone."
        confirmLabel="Cancel Reservation"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
