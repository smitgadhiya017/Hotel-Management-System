import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { AppData } from '../hooks/useAppData';
import { resetDemoData } from '../hooks/useAppData';
import { HotelSettings } from '../types';
import { PageHeader, Btn, FormField, Input, Textarea, Select, ConfirmDialog } from '../components/shared';
import { toast } from 'sonner';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY'];
const TABS = ['Hotel Profile', 'Notifications', 'Preferences', 'Reset'];

export function Settings() {
  const { settings, updateSettings } = useOutletContext<AppData>();
  const [activeTab, setActiveTab] = useState('Hotel Profile');
  const [form, setForm] = useState<HotelSettings>({ ...settings });
  const [resetConfirm, setResetConfirm] = useState(false);

  function handleSave() {
    updateSettings(form);
    toast.success('Settings saved successfully');
  }

  function handleReset() {
    setForm({ ...settings });
    toast.success('Changes discarded');
  }

  function handleResetDemo() {
    setResetConfirm(false);
    toast.success('Resetting demo data...');
    setTimeout(resetDemoData, 800);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader title="Settings" subtitle="Configure your hotel management preferences and profile." />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        {activeTab === 'Hotel Profile' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Hotel Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Hotel Name" required className="sm:col-span-2">
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="GrandStay Hotel" />
              </FormField>
              <FormField label="Address" className="sm:col-span-2">
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Hotel address" />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="reservations@grandstay.in" />
              </FormField>
              <FormField label="Phone">
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 (022) 6655 4321" />
              </FormField>
              <FormField label="Currency">
                <Select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </Select>
              </FormField>
              <FormField label="Tax Percentage (%)">
                <Input type="number" min={0} max={100} step={0.1} value={form.taxPercentage} onChange={e => setForm(f => ({ ...f, taxPercentage: +e.target.value }))} />
              </FormField>
              <FormField label="Default Check-in Time">
                <Input type="time" value={form.checkInTime} onChange={e => setForm(f => ({ ...f, checkInTime: e.target.value }))} />
              </FormField>
              <FormField label="Default Check-out Time">
                <Input type="time" value={form.checkOutTime} onChange={e => setForm(f => ({ ...f, checkOutTime: e.target.value }))} />
              </FormField>
              <FormField label="Invoice Footer" className="sm:col-span-2">
                <Textarea rows={2} value={form.invoiceFooter} onChange={e => setForm(f => ({ ...f, invoiceFooter: e.target.value }))} placeholder="Thank you message on invoices..." />
              </FormField>
            </div>
          </div>
        )}

        {activeTab === 'Notifications' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Notification Preferences</h3>
            <p className="text-sm text-slate-500 mb-4">Choose which events you want to be notified about.</p>
            {[
              { key: 'newReservation' as const, label: 'New Reservations', desc: 'Get notified when a new reservation is created' },
              { key: 'checkIn' as const, label: 'Guest Check-in', desc: 'Get notified when a guest checks in' },
              { key: 'checkOut' as const, label: 'Guest Check-out', desc: 'Get notified when a guest checks out' },
              { key: 'payment' as const, label: 'Payment Received', desc: 'Get notified when a payment is processed' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, notifications: { ...f.notifications, [key]: !f.notifications[key] } }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.notifications[key] ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${form.notifications[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Preferences' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Appearance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setForm(f => ({ ...f, appearance: { ...f.appearance, theme: 'light' } }))}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${form.appearance.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="w-full h-16 bg-white rounded-lg border border-slate-200 mb-2 flex items-center justify-center">
                  <div className="w-3/4 h-2 bg-slate-200 rounded" />
                </div>
                <p className="text-sm font-medium text-center">Light Mode</p>
              </div>
              <div
                onClick={() => setForm(f => ({ ...f, appearance: { ...f.appearance, theme: 'dark' } }))}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${form.appearance.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="w-full h-16 bg-slate-800 rounded-lg border border-slate-700 mb-2 flex items-center justify-center">
                  <div className="w-3/4 h-2 bg-slate-600 rounded" />
                </div>
                <p className="text-sm font-medium text-center">Dark Mode</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg mt-4">
              <div>
                <p className="text-sm font-medium text-slate-800">Collapsed Sidebar</p>
                <p className="text-xs text-slate-500 mt-0.5">Start with sidebar collapsed on desktop</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, appearance: { ...f.appearance, sidebarCollapsed: !f.appearance.sidebarCollapsed } }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.appearance.sidebarCollapsed ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${form.appearance.sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Reset' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Reset Demo Data</h3>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">This will permanently reset all demo data</p>
                <p className="text-sm text-red-600 mt-1">All rooms, guests, reservations, payments, and staff will be restored to the original demo state. Any changes you've made will be lost.</p>
              </div>
            </div>
            <Btn variant="danger" onClick={() => setResetConfirm(true)}>
              <RotateCcw className="w-4 h-4" /> Reset Demo Data
            </Btn>
          </div>
        )}
      </div>

      {activeTab !== 'Reset' && (
        <div className="flex items-center gap-3">
          <Btn onClick={handleSave}>
            <Save className="w-4 h-4" /> Save Changes
          </Btn>
          <Btn variant="secondary" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" /> Discard Changes
          </Btn>
        </div>
      )}

      <ConfirmDialog
        open={resetConfirm}
        title="Reset Demo Data"
        message="Are you sure? This will erase all your changes and restore the original demo data. The page will reload."
        confirmLabel="Yes, Reset Everything"
        onConfirm={handleResetDemo}
        onCancel={() => setResetConfirm(false)}
      />
    </div>
  );
}
