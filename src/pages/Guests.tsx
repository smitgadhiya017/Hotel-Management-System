import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { AppData } from '../hooks/useAppData';
import { Guest, GuestStatus } from '../types';
import {
  PageHeader, StatusBadge, SearchInput, SelectFilter, ConfirmDialog,
  Pagination, Modal, Btn, FormField, Input, Textarea, Select, EmptyState, Avatar
} from '../components/shared';
import { formatCurrency, formatDate, generateId } from '../lib/utils';
import { toast } from 'sonner';

const PAGE_SIZE = 10;
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'UAE', 'Singapore', 'Australia', 'Germany', 'France', 'Canada', 'Other'];

const initForm = { firstName: '', lastName: '', email: '', phone: '', country: 'India', address: '', notes: '', status: 'Active' as GuestStatus };

export function Guests() {
  const { guests, reservations, addGuest, updateGuest, deleteGuest } = useOutletContext<AppData>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewGuest, setViewGuest] = useState<Guest | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState<Partial<typeof initForm>>({});

  const filtered = useMemo(() => {
    let data = [...guests];
    if (search) data = data.filter(g => `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase()) || g.email.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) data = data.filter(g => g.status === statusFilter);
    return data;
  }, [guests, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function validate(): boolean {
    const e: Partial<typeof initForm> = {};
    if (!form.firstName.trim()) e.firstName = 'First name required';
    if (!form.lastName.trim()) e.lastName = 'Last name required';
    if (!form.email.trim()) e.email = 'Email required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openNew() { setEditGuest(null); setForm(initForm); setErrors({}); setFormOpen(true); }
  function openEdit(g: Guest) {
    setEditGuest(g);
    setForm({ firstName: g.firstName, lastName: g.lastName, email: g.email, phone: g.phone, country: g.country, address: g.address, notes: g.notes, status: g.status });
    setErrors({}); setFormOpen(true);
  }

  function handleSubmit() {
    if (!validate()) return;
    if (editGuest) {
      updateGuest({ ...editGuest, ...form });
      toast.success('Guest updated successfully');
    } else {
      addGuest({ id: generateId('g'), ...form, totalBookings: 0, totalSpent: 0, createdAt: new Date().toISOString() });
      toast.success(`Guest ${form.firstName} ${form.lastName} added`);
    }
    setFormOpen(false);
  }

  function handleDelete() {
    if (deleteId) { deleteGuest(deleteId); toast.success('Guest deleted'); setDeleteId(null); }
  }

  const guestReservations = (guestId: string) => reservations.filter(r => r.guestId === guestId);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Guests" subtitle="Manage guest profiles, contact details, and reservation history.">
        <Btn onClick={openNew}><Plus className="w-4 h-4" /> Add Guest</Btn>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or email..." className="flex-1" />
        <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={[{ value: 'Active', label: 'Active' }, { value: 'VIP', label: 'VIP' }, { value: 'Blacklisted', label: 'Blacklisted' }]} placeholder="All Statuses" className="w-full sm:w-40" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              {['Guest', 'Contact', 'Country', 'Bookings', 'Total Spent', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {paged.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={<Users className="w-10 h-10" />} title="No guests found" description="Add your first guest or adjust your search." action={<Btn onClick={openNew}><Plus className="w-4 h-4" /> Add Guest</Btn>} /></td></tr>
              ) : paged.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={g.firstName} lastName={g.lastName} />
                      <div>
                        <p className="font-semibold text-slate-800">{g.firstName} {g.lastName}</p>
                        <p className="text-xs text-slate-400">{g.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-700">{g.email}</p>
                    <p className="text-xs text-slate-500">{g.phone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{g.country}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-semibold text-slate-800">{g.totalBookings}</span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{formatCurrency(g.totalSpent)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={g.status} /></td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(g.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewGuest(g)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(g)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(g.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Showing {paged.length} of {filtered.length} guests</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* View Guest Profile */}
      {viewGuest && (
        <Modal open={!!viewGuest} onClose={() => setViewGuest(null)} title="Guest Profile" maxWidth="max-w-lg">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <Avatar firstName={viewGuest.firstName} lastName={viewGuest.lastName} size="lg" />
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewGuest.firstName} {viewGuest.lastName}</h3>
                <StatusBadge status={viewGuest.status} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><p className="text-xs text-slate-500">Email</p><p className="text-sm">{viewGuest.email}</p></div>
              <div><p className="text-xs text-slate-500">Phone</p><p className="text-sm">{viewGuest.phone}</p></div>
              <div><p className="text-xs text-slate-500">Country</p><p className="text-sm">{viewGuest.country}</p></div>
              <div><p className="text-xs text-slate-500">Member Since</p><p className="text-sm">{formatDate(viewGuest.createdAt)}</p></div>
              <div><p className="text-xs text-slate-500">Total Bookings</p><p className="text-xl font-bold text-blue-600">{guestReservations(viewGuest.id).length}</p></div>
              <div><p className="text-xs text-slate-500">Total Spent</p><p className="text-xl font-bold text-green-600">{formatCurrency(viewGuest.totalSpent)}</p></div>
            </div>
            {viewGuest.address && <div className="mb-4"><p className="text-xs text-slate-500">Address</p><p className="text-sm">{viewGuest.address}</p></div>}
            {viewGuest.notes && <div className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500 mb-1">Notes</p><p className="text-sm text-slate-700">{viewGuest.notes}</p></div>}
            {guestReservations(viewGuest.id).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Reservations</p>
                <div className="space-y-2">
                  {guestReservations(viewGuest.id).slice(0, 3).map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs font-mono text-slate-600">{r.bookingId}</p>
                        <p className="text-xs text-slate-500">Room {r.roomNumber} · {formatDate(r.checkIn)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(r.totalAmount)}</p>
                        <StatusBadge status={r.bookingStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Form */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editGuest ? 'Edit Guest' : 'Add New Guest'} maxWidth="max-w-lg">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" error={errors.firstName} required>
              <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First name" />
            </FormField>
            <FormField label="Last Name" error={errors.lastName} required>
              <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last name" />
            </FormField>
            <FormField label="Email" error={errors.email} required className="col-span-2">
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 8900" />
            </FormField>
            <FormField label="Country">
              <Select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as GuestStatus }))}>
                {['Active', 'VIP', 'Blacklisted'].map(s => <option key={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Address" className="col-span-2">
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address" />
            </FormField>
            <FormField label="Notes" className="col-span-2">
              <Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special notes or preferences..." />
            </FormField>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <Btn variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Btn>
          <Btn onClick={handleSubmit}>{editGuest ? 'Save Changes' : 'Add Guest'}</Btn>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Guest" message="Are you sure you want to delete this guest? This action cannot be undone." confirmLabel="Delete Guest" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
