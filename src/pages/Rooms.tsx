import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, LayoutGrid, List, BedDouble, Wifi, Wind, Tv, Wine } from 'lucide-react';
import { AppData } from '../hooks/useAppData';
import { Room, RoomType, RoomStatus } from '../types';
import {
  PageHeader, StatusBadge, KpiCard, SearchInput, SelectFilter,
  ConfirmDialog, Pagination, Modal, Btn, FormField, Input, Textarea, Select, EmptyState
} from '../components/shared';
import { formatCurrency, generateId } from '../lib/utils';
import { toast } from 'sonner';

const PAGE_SIZE = 9;
const AMENITY_OPTIONS = ['Wi-Fi', 'Air Conditioning', 'TV', 'Balcony', 'Mini Bar'];
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Wi-Fi': <Wifi className="w-3 h-3" />,
  'Air Conditioning': <Wind className="w-3 h-3" />,
  'TV': <Tv className="w-3 h-3" />,
  'Balcony': <span className="text-[10px]">🏔️</span>,
  'Mini Bar': <Wine className="w-3 h-3" />,
};

const ROOM_TYPE_COLORS: Record<RoomType, string> = {
  Standard: 'bg-slate-100 text-slate-700',
  Deluxe: 'bg-blue-100 text-blue-700',
  Suite: 'bg-purple-100 text-purple-700',
  Family: 'bg-green-100 text-green-700',
};

const ROOM_STATUS_BG: Record<RoomStatus, string> = {
  Available: 'border-t-4 border-t-green-500',
  Occupied: 'border-t-4 border-t-blue-500',
  Reserved: 'border-t-4 border-t-amber-500',
  Maintenance: 'border-t-4 border-t-red-500',
};

const initialFormData = {
  roomNumber: '', type: 'Standard' as RoomType, floor: 1, capacity: 2,
  pricePerNight: 89, status: 'Available' as RoomStatus, amenities: ['Wi-Fi', 'Air Conditioning', 'TV'],
  description: ''
};

export function Rooms() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useOutletContext<AppData>();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewRoom, setViewRoom] = useState<Room | null>(null);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialFormData);
  const [errors, setErrors] = useState<Partial<typeof initialFormData & { roomNumber: string }>>({});

  const filtered = useMemo(() => {
    let data = [...rooms];
    if (search) data = data.filter(r => r.roomNumber.includes(search) || r.type.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter) data = data.filter(r => r.type === typeFilter);
    if (statusFilter) data = data.filter(r => r.status === statusFilter);
    return data;
  }, [rooms, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'Available').length,
    occupied: rooms.filter(r => r.status === 'Occupied').length,
    reserved: rooms.filter(r => r.status === 'Reserved').length,
    maintenance: rooms.filter(r => r.status === 'Maintenance').length,
  };

  function validate(): boolean {
    const e: Partial<typeof form & { roomNumber: string }> = {};
    if (!form.roomNumber.trim()) e.roomNumber = 'Room number required';
    if (rooms.some(r => r.roomNumber === form.roomNumber && r.id !== editRoom?.id)) e.roomNumber = 'Room number already exists';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openNew() {
    setEditRoom(null);
    setForm(initialFormData);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(room: Room) {
    setEditRoom(room);
    setForm({ roomNumber: room.roomNumber, type: room.type, floor: room.floor, capacity: room.capacity, pricePerNight: room.pricePerNight, status: room.status, amenities: [...room.amenities], description: room.description });
    setErrors({});
    setFormOpen(true);
  }

  function toggleAmenity(a: string) {
    setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));
  }

  function handleSubmit() {
    if (!validate()) return;
    if (editRoom) {
      updateRoom({ ...editRoom, ...form });
      toast.success('Room updated successfully');
    } else {
      addRoom({ id: generateId('r'), ...form });
      toast.success(`Room ${form.roomNumber} added successfully`);
    }
    setFormOpen(false);
  }

  function handleDelete() {
    if (deleteId) { deleteRoom(deleteId); toast.success('Room deleted'); setDeleteId(null); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Rooms" subtitle="Manage hotel rooms, types, and availability.">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView('table')} className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-4 h-4" /></button>
          </div>
          <Btn onClick={openNew}><Plus className="w-4 h-4" /> Add Room</Btn>
        </div>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: counts.total, accent: 'bg-slate-50 text-slate-600' },
          { label: 'Available', value: counts.available, accent: 'bg-green-50 text-green-600' },
          { label: 'Occupied', value: counts.occupied, accent: 'bg-blue-50 text-blue-600' },
          { label: 'Reserved', value: counts.reserved, accent: 'bg-amber-50 text-amber-600' },
          { label: 'Maintenance', value: counts.maintenance, accent: 'bg-red-50 text-red-600' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-card">
            <p className={`text-2xl font-bold ${accent.split(' ')[1]}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by room number or type..." className="flex-1" />
        <SelectFilter value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1); }} options={[{ value: 'Standard', label: 'Standard' }, { value: 'Deluxe', label: 'Deluxe' }, { value: 'Suite', label: 'Suite' }, { value: 'Family', label: 'Family' }]} placeholder="All Types" className="w-full sm:w-36" />
        <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={[{ value: 'Available', label: 'Available' }, { value: 'Occupied', label: 'Occupied' }, { value: 'Reserved', label: 'Reserved' }, { value: 'Maintenance', label: 'Maintenance' }]} placeholder="All Statuses" className="w-full sm:w-40" />
      </div>

      {paged.length === 0 && (
        <EmptyState icon={<BedDouble className="w-12 h-12" />} title="No rooms found" description="Try adjusting your search or add a new room." action={<Btn onClick={openNew}><Plus className="w-4 h-4" /> Add Room</Btn>} />
      )}

      {/* Grid View */}
      {view === 'grid' && paged.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map(room => (
            <div key={room.id} className={`bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden hover:shadow-card-md transition-shadow ${ROOM_STATUS_BG[room.status]}`}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-slate-900">Room {room.roomNumber}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROOM_TYPE_COLORS[room.type]}`}>{room.type}</span>
                    </div>
                    <p className="text-xs text-slate-500">Floor {room.floor} · Up to {room.capacity} guests</p>
                  </div>
                  <StatusBadge status={room.status} />
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{room.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {room.amenities.slice(0, 4).map(a => (
                    <span key={a} className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                      {AMENITY_ICONS[a]} {a}
                    </span>
                  ))}
                  {room.amenities.length > 4 && <span className="text-xs text-slate-400">+{room.amenities.length - 4} more</span>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(room.pricePerNight)}<span className="text-xs font-normal text-slate-400">/night</span></p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewRoom(room)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(room)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(room.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && paged.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                {['Room', 'Type', 'Floor', 'Capacity', 'Price/Night', 'Amenities', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map(room => (
                  <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">Room {room.roomNumber}</td>
                    <td className="px-4 py-3.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROOM_TYPE_COLORS[room.type]}`}>{room.type}</span></td>
                    <td className="px-4 py-3.5 text-slate-600">Floor {room.floor}</td>
                    <td className="px-4 py-3.5 text-slate-600">{room.capacity} guests</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{formatCurrency(room.pricePerNight)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map(a => <span key={a} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{a}</span>)}
                        {room.amenities.length > 3 && <span className="text-xs text-slate-400">+{room.amenities.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={room.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewRoom(room)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(room)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(room.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Showing {paged.length} of {filtered.length} rooms</p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Pagination for grid view */}
      {view === 'grid' && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* View Room Dialog */}
      {viewRoom && (
        <Modal open={!!viewRoom} onClose={() => setViewRoom(null)} title={`Room ${viewRoom.roomNumber} Details`} maxWidth="max-w-md">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-500">Type</p><p className="text-sm font-medium">{viewRoom.type}</p></div>
              <div><p className="text-xs text-slate-500">Status</p><StatusBadge status={viewRoom.status} /></div>
              <div><p className="text-xs text-slate-500">Floor</p><p className="text-sm">{viewRoom.floor}</p></div>
              <div><p className="text-xs text-slate-500">Capacity</p><p className="text-sm">{viewRoom.capacity} guests</p></div>
              <div><p className="text-xs text-slate-500">Price/Night</p><p className="text-sm font-bold">{formatCurrency(viewRoom.pricePerNight)}</p></div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {viewRoom.amenities.map(a => <span key={a} className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{AMENITY_ICONS[a]} {a}</span>)}
              </div>
            </div>
            {viewRoom.description && <div><p className="text-xs text-slate-500 mb-1">Description</p><p className="text-sm text-slate-700">{viewRoom.description}</p></div>}
          </div>
        </Modal>
      )}

      {/* Form Dialog */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editRoom ? `Edit Room ${editRoom.roomNumber}` : 'Add New Room'} maxWidth="max-w-lg">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Room Number" error={errors.roomNumber as string | undefined} required>
              <Input value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="e.g. 101" />
            </FormField>
            <FormField label="Room Type" required>
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as RoomType }))}>
                {['Standard', 'Deluxe', 'Suite', 'Family'].map(t => <option key={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Floor">
              <Input type="number" min={1} max={20} value={form.floor} onChange={e => setForm(f => ({ ...f, floor: +e.target.value }))} />
            </FormField>
            <FormField label="Capacity (guests)">
              <Input type="number" min={1} max={10} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} />
            </FormField>
            <FormField label="Price per Night (₹)" required>
              <Input type="number" min={1} value={form.pricePerNight} onChange={e => setForm(f => ({ ...f, pricePerNight: +e.target.value }))} />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as RoomStatus }))}>
                {['Available', 'Occupied', 'Reserved', 'Maintenance'].map(s => <option key={s}>{s}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Amenities">
            <div className="flex flex-wrap gap-2 mt-1">
              {AMENITY_OPTIONS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${form.amenities.includes(a) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                  {AMENITY_ICONS[a]} {a}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Description">
            <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief room description..." />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <Btn variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Btn>
          <Btn onClick={handleSubmit}>{editRoom ? 'Save Changes' : 'Add Room'}</Btn>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Room"
        message="Are you sure you want to delete this room? This cannot be undone."
        confirmLabel="Delete Room"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
