import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, UserCog } from 'lucide-react';
import { AppData } from '../hooks/useAppData';
import { StaffMember, StaffRole, StaffStatus } from '../types';
import {
  PageHeader, StatusBadge, SearchInput, SelectFilter, ConfirmDialog,
  Pagination, Modal, Btn, FormField, Input, Select, EmptyState, Avatar
} from '../components/shared';
import { formatDate, generateId, generateEmployeeId } from '../lib/utils';
import { toast } from 'sonner';

const PAGE_SIZE = 8;
const ROLES: StaffRole[] = ['Administrator', 'Manager', 'Receptionist', 'Housekeeping', 'Maintenance'];
const ROLE_COLORS: Record<StaffRole, string> = {
  Administrator: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  Receptionist: 'bg-green-100 text-green-700',
  Housekeeping: 'bg-amber-100 text-amber-700',
  Maintenance: 'bg-orange-100 text-orange-700',
};

const initForm = { firstName: '', lastName: '', role: 'Receptionist' as StaffRole, email: '', phone: '', joiningDate: '', status: 'Active' as StaffStatus, department: '' };

export function Staff() {
  const { staff, addStaff, updateStaff, deleteStaff } = useOutletContext<AppData>();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMember, setViewMember] = useState<StaffMember | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState<Partial<typeof initForm>>({});

  const filtered = useMemo(() => {
    let data = [...staff];
    if (search) data = data.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));
    if (roleFilter) data = data.filter(s => s.role === roleFilter);
    if (statusFilter) data = data.filter(s => s.status === statusFilter);
    return data;
  }, [staff, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function validate(): boolean {
    const e: Partial<typeof initForm> = {};
    if (!form.firstName.trim()) e.firstName = 'First name required';
    if (!form.lastName.trim()) e.lastName = 'Last name required';
    if (!form.email.trim()) e.email = 'Email required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openNew() { setEditMember(null); setForm(initForm); setErrors({}); setFormOpen(true); }
  function openEdit(s: StaffMember) {
    setEditMember(s);
    setForm({ firstName: s.firstName, lastName: s.lastName, role: s.role, email: s.email, phone: s.phone, joiningDate: s.joiningDate, status: s.status, department: s.department });
    setErrors({}); setFormOpen(true);
  }

  function handleSubmit() {
    if (!validate()) return;
    if (editMember) {
      updateStaff({ ...editMember, ...form });
      toast.success('Staff member updated');
    } else {
      addStaff({ id: generateId('s'), employeeId: generateEmployeeId(), ...form });
      toast.success(`${form.firstName} ${form.lastName} added to staff`);
    }
    setFormOpen(false);
  }

  function handleDelete() {
    if (deleteId) { deleteStaff(deleteId); toast.success('Staff member removed'); setDeleteId(null); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Staff" subtitle="Manage hotel staff, roles, and employment status.">
        <Btn onClick={openNew}><Plus className="w-4 h-4" /> Add Staff</Btn>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or email..." className="flex-1" />
        <SelectFilter value={roleFilter} onChange={v => { setRoleFilter(v); setPage(1); }} options={ROLES.map(r => ({ value: r, label: r }))} placeholder="All Roles" className="w-full sm:w-44" />
        <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={[{ value: 'Active', label: 'Active' }, { value: 'On Leave', label: 'On Leave' }, { value: 'Inactive', label: 'Inactive' }]} placeholder="All Statuses" className="w-full sm:w-40" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              {['Employee', 'Employee ID', 'Role', 'Contact', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {paged.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={<UserCog className="w-10 h-10" />} title="No staff members found" description="Add your first staff member." action={<Btn onClick={openNew}><Plus className="w-4 h-4" /> Add Staff</Btn>} /></td></tr>
              ) : paged.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={s.firstName} lastName={s.lastName} />
                      <div>
                        <p className="font-semibold text-slate-800">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-slate-400">{s.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{s.employeeId}</span></td>
                  <td className="px-4 py-3.5"><span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_COLORS[s.role]}`}>{s.role}</span></td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-700">{s.email}</p>
                    <p className="text-xs text-slate-500">{s.phone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(s.joiningDate)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewMember(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Showing {paged.length} of {filtered.length} staff members</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* View Member */}
      {viewMember && (
        <Modal open={!!viewMember} onClose={() => setViewMember(null)} title="Staff Profile" maxWidth="max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <Avatar firstName={viewMember.firstName} lastName={viewMember.lastName} size="lg" />
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewMember.firstName} {viewMember.lastName}</h3>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_COLORS[viewMember.role]}`}>{viewMember.role}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Employee ID', viewMember.employeeId],
                ['Department', viewMember.department],
                ['Email', viewMember.email],
                ['Phone', viewMember.phone],
                ['Joined', formatDate(viewMember.joiningDate)],
                ['Status', ''],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-500">{label}</p>
                  {label === 'Status' ? <StatusBadge status={viewMember.status} /> : <p className="text-sm font-medium">{value}</p>}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Form */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editMember ? 'Edit Staff Member' : 'Add Staff Member'} maxWidth="max-w-lg">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" error={errors.firstName} required>
              <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First name" />
            </FormField>
            <FormField label="Last Name" error={errors.lastName} required>
              <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last name" />
            </FormField>
            <FormField label="Role">
              <Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as StaffRole }))}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </Select>
            </FormField>
            <FormField label="Department">
              <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Front Desk" />
            </FormField>
            <FormField label="Email" error={errors.email} required className="col-span-2">
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@grandstay.in" />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="Joining Date">
              <Input type="date" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StaffStatus }))}>
                <option>Active</option><option>On Leave</option><option>Inactive</option>
              </Select>
            </FormField>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <Btn variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Btn>
          <Btn onClick={handleSubmit}>{editMember ? 'Save Changes' : 'Add Staff'}</Btn>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Remove Staff Member" message="Are you sure you want to remove this staff member? This cannot be undone." confirmLabel="Remove" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
