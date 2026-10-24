import React, { useState, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Eye, Plus, Printer, CreditCard } from 'lucide-react';
import { AppData } from '../hooks/useAppData';
import { Payment, PaymentMethod, PaymentStatus } from '../types';
import {
  PageHeader, KpiCard, StatusBadge, SearchInput, SelectFilter,
  Pagination, Modal, Btn, FormField, Input, Select, EmptyState
} from '../components/shared';
import { formatCurrency, formatDate, formatDateTime, generateId, generatePaymentId, getTodayString } from '../lib/utils';
import { toast } from 'sonner';

const PAGE_SIZE = 8;

export function Payments() {
  const { payments, reservations, guests, addPayment, settings } = useOutletContext<AppData>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [invoicePayment, setInvoicePayment] = useState<Payment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ bookingId: '', amount: 0, method: 'Card' as PaymentMethod, notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const invoiceRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let data = [...payments];
    if (search) data = data.filter(p => p.paymentId.toLowerCase().includes(search.toLowerCase()) || p.guestName.toLowerCase().includes(search.toLowerCase()) || p.bookingId.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) data = data.filter(p => p.status === statusFilter);
    return data.sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summary = {
    totalRevenue: payments.filter(p => p.status === 'Paid').reduce((s, p) => s + Number(p.amount || 0), 0),
    received: payments.filter(p => p.status === 'Paid').length,
    pending: payments.filter(p => p.status === 'Unpaid' || p.status === 'Partial').reduce((s, p) => s + Number(p.amount || 0), 0),
    refunded: payments.filter(p => p.status === 'Refunded').reduce((s, p) => s + Number(p.amount || 0), 0),
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.bookingId) e.bookingId = 'Select a booking';
    if (form.amount <= 0) e.amount = 'Amount must be positive';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const res = reservations.find(r => r.bookingId === form.bookingId);
    if (!res) return;
    addPayment({
      id: generateId('p'),
      paymentId: generatePaymentId(),
      bookingId: res.bookingId,
      reservationId: res.id,
      guestId: res.guestId,
      guestName: res.guestName,
      date: getTodayString(),
      method: form.method,
      amount: form.amount,
      status: 'Paid',
      notes: form.notes,
    });
    toast.success('Payment recorded successfully');
    setFormOpen(false);
    setForm({ bookingId: '', amount: 0, method: 'Card', notes: '' });
  }

  function handlePrintInvoice() {
    window.print();
  }

  const invoiceReservation = invoicePayment ? reservations.find(r => r.bookingId === invoicePayment.bookingId) : null;

  return (
    <div className="space-y-6 animate-fade-in no-print">
      <PageHeader title="Payments & Invoices" subtitle="Track payments, manage invoices, and monitor financial status.">
        <Btn onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> Record Payment</Btn>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} icon={<CreditCard className="w-5 h-5" />} accent="bg-green-50 text-green-600" />
        <KpiCard title="Payments Received" value={summary.received} icon={<CreditCard className="w-5 h-5" />} accent="bg-blue-50 text-blue-600" subtitle="Paid transactions" />
        <KpiCard title="Pending Payments" value={formatCurrency(summary.pending)} icon={<CreditCard className="w-5 h-5" />} accent="bg-amber-50 text-amber-600" />
        <KpiCard title="Refunded Amount" value={formatCurrency(summary.refunded)} icon={<CreditCard className="w-5 h-5" />} accent="bg-red-50 text-red-600" />
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by payment ID, booking, or guest..." className="flex-1" />
          <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={[{ value: 'Paid', label: 'Paid' }, { value: 'Partial', label: 'Partial' }, { value: 'Unpaid', label: 'Unpaid' }, { value: 'Refunded', label: 'Refunded' }]} placeholder="All Statuses" className="w-full sm:w-40" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              {['Payment ID', 'Booking ID', 'Guest', 'Date', 'Method', 'Amount', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {paged.length === 0 ? (
                <tr><td colSpan={8}><EmptyState title="No payments found" description="Adjust your search or record a new payment." /></td></tr>
              ) : paged.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5"><span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{p.paymentId}</span></td>
                  <td className="px-4 py-3.5"><span className="text-xs font-mono text-blue-600">{p.bookingId}</span></td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">{p.guestName}</td>
                  <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(p.date)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.method === 'UPI' ? 'bg-emerald-50 text-emerald-700' :
                      p.method === 'Card' ? 'bg-blue-50 text-blue-700' :
                      p.method === 'Cash' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {p.method}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewPayment(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => setInvoicePayment(p)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Invoice"><Printer className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Showing {paged.length} of {filtered.length} payments</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Record Payment */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Record Payment" maxWidth="max-w-md">
        <div className="p-6 space-y-4">
          <FormField label="Booking" error={errors.bookingId} required>
            <Select value={form.bookingId} onChange={e => setForm(f => ({ ...f, bookingId: e.target.value }))}>
              <option value="">— Select booking —</option>
              {reservations.filter(r => r.paymentStatus !== 'Paid').map(r => (
                <option key={r.id} value={r.bookingId}>{r.bookingId} — {r.guestName} ({formatCurrency(r.totalAmount)})</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Amount (₹)" error={errors.amount} required>
            <Input type="number" min={0} step={1} value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} placeholder="0" />
          </FormField>
          <FormField label="Payment Method">
            <Select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as PaymentMethod }))}>
              <option>UPI</option><option>Card</option><option>Cash</option><option>Bank Transfer</option>
            </Select>
          </FormField>
          <FormField label="Notes">
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional payment notes..." />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <Btn variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Btn>
          <Btn onClick={handleSubmit}>Record Payment</Btn>
        </div>
      </Modal>

      {/* View Payment Dialog */}
      {viewPayment && (
        <Modal open={!!viewPayment} onClose={() => setViewPayment(null)} title="Payment Details" maxWidth="max-w-sm">
          <div className="p-6 space-y-3">
            {[
              ['Payment ID', viewPayment.paymentId],
              ['Booking ID', viewPayment.bookingId],
              ['Guest', viewPayment.guestName],
              ['Date', formatDate(viewPayment.date)],
              ['Method', viewPayment.method],
              ['Amount', formatCurrency(viewPayment.amount)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-800">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={viewPayment.status} />
            </div>
            {viewPayment.notes && <div className="p-3 bg-slate-50 rounded-lg mt-2"><p className="text-xs text-slate-500">Notes</p><p className="text-sm">{viewPayment.notes}</p></div>}
          </div>
        </Modal>
      )}

      {/* Invoice Modal */}
      {invoicePayment && invoiceReservation && (
        <Modal open={!!invoicePayment} onClose={() => setInvoicePayment(null)} title="Invoice Preview" maxWidth="max-w-2xl">
          <div className="p-6">
            <div ref={invoiceRef} id="invoice-content" className="bg-white rounded-lg">
              {/* Invoice Header */}
              <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-slate-900">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{settings.name}</h2>
                  <p className="text-sm text-slate-600 mt-1">{settings.address}</p>
                  <p className="text-sm text-slate-600">{settings.email}</p>
                  <p className="text-sm text-slate-600">{settings.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">INVOICE</p>
                  <p className="text-sm text-slate-600 mt-1">#{invoicePayment.paymentId}</p>
                  <p className="text-sm text-slate-600">{formatDate(invoicePayment.date)}</p>
                  <StatusBadge status={invoicePayment.status} className="mt-2" />
                </div>
              </div>

              {/* Guest & Booking Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Bill To</p>
                  <p className="font-semibold text-slate-900">{invoiceReservation.guestName}</p>
                  <p className="text-sm text-slate-600">{invoiceReservation.guestEmail}</p>
                  <p className="text-sm text-slate-600">{invoiceReservation.guestPhone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Booking Details</p>
                  <p className="text-sm"><span className="text-slate-500">Booking ID:</span> <span className="font-mono font-medium">{invoiceReservation.bookingId}</span></p>
                  <p className="text-sm"><span className="text-slate-500">Check-in:</span> {formatDate(invoiceReservation.checkIn)}</p>
                  <p className="text-sm"><span className="text-slate-500">Check-out:</span> {formatDate(invoiceReservation.checkOut)}</p>
                  <p className="text-sm"><span className="text-slate-500">Nights:</span> {invoiceReservation.nights}</p>
                </div>
              </div>

              {/* Itemized Charges */}
              <table className="w-full mb-6">
                <thead><tr className="bg-slate-900 text-white">
                  <th className="text-left px-4 py-2 text-xs font-semibold">Description</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold">Qty</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold">Unit Price</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold">Total</th>
                </tr></thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-3 text-sm">Room {invoiceReservation.roomNumber} — {invoiceReservation.roomType}</td>
                    <td className="px-4 py-3 text-sm text-center">{invoiceReservation.nights} nights</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(invoiceReservation.pricePerNight)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(invoiceReservation.pricePerNight * invoiceReservation.nights)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(invoiceReservation.totalAmount)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Tax ({settings.taxPercentage}%)</span><span>{formatCurrency(invoiceReservation.totalAmount * settings.taxPercentage / 100)}</span></div>
                  <div className="flex justify-between text-base font-bold border-t border-slate-300 pt-1.5"><span>Total</span><span>{formatCurrency(invoiceReservation.totalAmount * (1 + settings.taxPercentage / 100))}</span></div>
                  <div className="flex justify-between text-sm text-green-600"><span>Amount Paid</span><span>{formatCurrency(invoicePayment.amount)}</span></div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-600">{settings.invoiceFooter}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 no-print">
              <Btn variant="secondary" onClick={() => setInvoicePayment(null)}>Close</Btn>
              <Btn onClick={handlePrintInvoice}><Printer className="w-4 h-4" /> Print Invoice</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
