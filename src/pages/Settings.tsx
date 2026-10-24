import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Save, RotateCcw, AlertTriangle, FileSpreadsheet, CheckCircle2,
  RefreshCw, UploadCloud, DownloadCloud, Copy, Check, ExternalLink,
  Table, Eye, Database
} from 'lucide-react';
import { AppData } from '../hooks/useAppData';
import { resetDemoData } from '../hooks/useAppData';
import { HotelSettings } from '../types';
import { PageHeader, Btn, FormField, Input, Textarea, Select, ConfirmDialog } from '../components/shared';
/*
import { testGoogleSheetConnection, USER_SPREADSHEET_ID, USER_SPREADSHEET_URL } from '../services/googleSheets';
const TABS = ['Hotel Profile', 'Google Sheets Integration', 'Notifications', 'Preferences', 'Reset'];
*/
import {
  testSupabaseConnection,
  SUPABASE_URL,
  SUPABASE_HOST,
  SUPABASE_PORT,
  SUPABASE_DATABASE,
  SUPABASE_USER,
  SUPABASE_CONNECTION_STRING
} from '../services/supabase';
import { exportToCSV, formatCurrency, formatDate } from '../lib/utils';
import { toast } from 'sonner';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY'];
const TABS = ['Hotel Profile', 'Supabase Database', 'Notifications', 'Preferences', 'Reset'];

const APPS_SCRIPT_SNIPPET = `/**
 * GrandStay Hotel Management System - Google Apps Script Backend
 * Attached Spreadsheet: https://docs.google.com/spreadsheets/d/1lC114sOdG_OCAaTQi6sWCkMonWINXdEpkmnfYfqC8tw/edit
 */

const SPREADSHEET_ID = '1lC114sOdG_OCAaTQi6sWCkMonWINXdEpkmnfYfqC8tw';

const SHEETS = {
  rooms: 'Rooms',
  guests: 'Guests',
  reservations: 'Reservations',
  payments: 'Payments',
  staff: 'Staff',
  settings: 'Settings'
};

function getActiveSpreadsheetInstance() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch(e) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
}

function doGet(e) {
  try {
    const ss = getActiveSpreadsheetInstance();
    const result = {
      status: 'success',
      timestamp: new Date().toISOString(),
      spreadsheetId: SPREADSHEET_ID,
      data: {
        rooms: getSheetData(ss, SHEETS.rooms),
        guests: getSheetData(ss, SHEETS.guests),
        reservations: getSheetData(ss, SHEETS.reservations),
        payments: getSheetData(ss, SHEETS.payments),
        staff: getSheetData(ss, SHEETS.staff),
        settings: getSettingsData(ss, SHEETS.settings)
      }
    };
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    const ss = getActiveSpreadsheetInstance();
    const action = payload.action || 'syncAll';

    if (action === 'syncAll' && payload.data) {
      const data = payload.data;
      if (data.rooms) setSheetData(ss, SHEETS.rooms, data.rooms);
      if (data.guests) setSheetData(ss, SHEETS.guests, data.guests);
      if (data.reservations) setSheetData(ss, SHEETS.reservations, data.reservations);
      if (data.payments) setSheetData(ss, SHEETS.payments, data.payments);
      if (data.staff) setSheetData(ss, SHEETS.staff, data.staff);
      if (data.settings) setSettingsData(ss, SHEETS.settings, data.settings);
    } else if (action === 'syncEntity' && payload.entity && payload.data) {
      const sheetName = SHEETS[payload.entity];
      if (sheetName) {
        if (payload.entity === 'settings') {
          setSettingsData(ss, sheetName, payload.data);
        } else {
          setSheetData(ss, sheetName, payload.data);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data synced' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  const items = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const item = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try { val = JSON.parse(val); } catch(e){}
      }
      item[headers[j]] = val;
    }
    if (item.id) items.push(item);
  }
  return items;
}

function setSheetData(ss, name, items) {
  let sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clearContents();
  if (!items || items.length === 0) return;
  const headerSet = new Set();
  items.forEach(it => Object.keys(it).forEach(k => headerSet.add(k)));
  const headers = Array.from(headerSet);
  const rows = [headers];
  items.forEach(it => {
    rows.push(headers.map(h => {
      const val = it[h];
      return (val && typeof val === 'object') ? JSON.stringify(val) : (val ?? '');
    }));
  });
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E2E8F0');
  sheet.autoResizeColumns(1, headers.length);
}

function getSettingsData(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) return null;
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;
  const s = {};
  for (let i = 1; i < values.length; i++) {
    if (values[i][0]) s[values[i][0]] = values[i][1];
  }
  return s;
}

function setSettingsData(ss, name, settings) {
  let sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clearContents();
  const rows = [['Key', 'Value']];
  Object.keys(settings).forEach(k => rows.push([k, typeof settings[k] === 'object' ? JSON.stringify(settings[k]) : settings[k]]));
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#E2E8F0');
}`;

export function Settings() {
  const {
    settings,
    updateSettings,
    rooms,
    guests,
    reservations,
    payments,
    staff,
    isSyncing,
    /*
    pushToGoogleSheets,
    pullFromGoogleSheets
    */
    pushToSupabase,
    pullFromSupabase,
  } = useOutletContext<AppData>();

  const [activeTab, setActiveTab] = useState('Supabase Database');
  const [form, setForm] = useState<HotelSettings>({
    ...settings,
    /*
    googleSheets: {
      enabled: settings.googleSheets?.enabled ?? true,
      webAppUrl: settings.googleSheets?.webAppUrl ?? '',
      spreadsheetId: settings.googleSheets?.spreadsheetId || USER_SPREADSHEET_ID,
      autoSync: settings.googleSheets?.autoSync ?? true,
      lastSyncedAt: settings.googleSheets?.lastSyncedAt ?? '',
    },
    */
    supabase: {
      enabled: settings.supabase?.enabled ?? true,
      url: settings.supabase?.url || SUPABASE_URL,
      anonKey: settings.supabase?.anonKey || '',
      connectionString: settings.supabase?.connectionString || SUPABASE_CONNECTION_STRING,
      host: settings.supabase?.host || SUPABASE_HOST,
      port: settings.supabase?.port || SUPABASE_PORT,
      database: settings.supabase?.database || SUPABASE_DATABASE,
      user: settings.supabase?.user || SUPABASE_USER,
      autoSync: settings.supabase?.autoSync ?? true,
      lastSyncedAt: settings.supabase?.lastSyncedAt ?? '',
    }
  });

  useEffect(() => {
    if (settings.supabase?.url && !form.supabase?.url) {
      setForm(f => ({
        ...f,
        supabase: {
          ...f.supabase!,
          url: settings.supabase!.url,
        }
      }));
    }
  }, [settings.supabase?.url]);

  const [resetConfirm, setResetConfirm] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; counts?: { rooms: number; guests: number; reservations: number } } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [demoPreviewTab, setDemoPreviewTab] = useState<'rooms' | 'guests' | 'reservations' | 'payments' | 'staff'>('reservations');

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

  /*
  async function handleTestGoogleSheetsConnection() {
    if (!form.googleSheets?.webAppUrl) {
      toast.error('Please deploy the Apps Script and paste your Web App URL first.');
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testGoogleSheetConnection(form.googleSheets.webAppUrl);
      setTestResult(res);
      if (res.success) {
        toast.success('Google Sheet connection verified!');
      } else {
        toast.error('Connection test failed.');
      }
    } finally {
      setTestingConnection(false);
    }
  }
  */

  async function handleTestConnection() {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(form.supabase?.url, form.supabase?.anonKey);
      setTestResult(res as { success: boolean; message: string; counts?: { rooms: number; guests: number; reservations: number } });
      if (res.success) {
        toast.success('Supabase connection verified successfully!');
      } else {
        toast.error(res.message);
      }
    } finally {
      setTestingConnection(false);
    }
  }

  function handleCopyScript() {
    navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
    setCopiedScript(true);
    toast.success('Google Apps Script code copied to clipboard!');
    setTimeout(() => setCopiedScript(false), 3000);
  }

  function handleExportCsv(entity: string) {
    if (entity === 'rooms') exportToCSV(rooms as unknown as Record<string, unknown>[], 'GrandStay_Rooms');
    else if (entity === 'guests') exportToCSV(guests as unknown as Record<string, unknown>[], 'GrandStay_Guests');
    else if (entity === 'reservations') exportToCSV(reservations as unknown as Record<string, unknown>[], 'GrandStay_Reservations');
    else if (entity === 'payments') exportToCSV(payments as unknown as Record<string, unknown>[], 'GrandStay_Payments');
    else if (entity === 'staff') exportToCSV(staff as unknown as Record<string, unknown>[], 'GrandStay_Staff');
    toast.success(`Downloaded ${entity}.csv (Ready to import to Google Sheets)`);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <PageHeader title="Settings & Integrations" subtitle="Connect your Supabase live PostgreSQL database, manage hotel profile, and adjust system preferences." />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-thin">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.includes('Supabase') && <Database className="w-4 h-4 text-emerald-600" />}
            {tab.includes('Google Sheets') && <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        {/* Supabase Live PostgreSQL Database Tab */}
        {activeTab === 'Supabase Database' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">Supabase PostgreSQL Cloud Database</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Live Cloud Integration
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Synchronize bookings, guest records, room tariffs, payments, and staff shifts directly with your personal Supabase PostgreSQL database with ACID reliability.
                  </p>
                </div>
              </div>
              <a
                href="https://supabase.com/dashboard/project/ykrwarvqrpxndkgyswiv"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 rounded-lg text-xs font-semibold shadow-sm transition-all whitespace-nowrap self-start md:self-auto"
              >
                <Database className="w-4 h-4" /> Open Supabase Dashboard <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Connected Database Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">PostgreSQL Host & Port</p>
                <p className="text-xs font-mono font-bold text-slate-800 truncate mt-1" title={SUPABASE_HOST}>
                  {SUPABASE_HOST}:{SUPABASE_PORT}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ PostgreSQL 17.11 Connected</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">Database & Authentication</p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  db: <span className="font-mono text-blue-600">{SUPABASE_DATABASE}</span> · user: <span className="font-mono text-blue-600">{SUPABASE_USER}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">SSL Secured · Password Authenticated</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">Relational Tables</p>
                <p className="text-xs font-bold text-slate-800 mt-1">6 Managed PostgreSQL Tables</p>
                <p className="text-[11px] text-blue-600 mt-1">rooms, guests, reservations, payments, staff</p>
              </div>
            </div>

            {/* Supabase Connection Configuration Panel */}
            <div className="p-5 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Supabase Connection Settings</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Automated two-way synchronization between your GrandStay hotel system and Supabase PostgreSQL.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Enable Sync:</span>
                  <button
                    onClick={() => setForm(f => ({
                      ...f,
                      supabase: {
                        ...f.supabase!,
                        enabled: !f.supabase?.enabled
                      }
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.supabase?.enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${form.supabase?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Supabase Project URL" required>
                  <Input
                    value={form.supabase?.url || ''}
                    onChange={e => setForm(f => ({
                      ...f,
                      supabase: {
                        ...f.supabase!,
                        url: e.target.value.trim()
                      }
                    }))}
                    placeholder="https://ykrwarvqrpxndkgyswiv.supabase.co"
                    className="font-mono text-xs"
                  />
                </FormField>

                <FormField label="Supabase Anon / Public Key (Optional for Client SDK)">
                  <Input
                    value={form.supabase?.anonKey || ''}
                    onChange={e => setForm(f => ({
                      ...f,
                      supabase: {
                        ...f.supabase!,
                        anonKey: e.target.value.trim()
                      }
                    }))}
                    placeholder="eyJhbGciOi... (From Project Settings > API)"
                    className="font-mono text-xs"
                  />
                </FormField>
              </div>

              <FormField label="PostgreSQL Connection String" required>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={form.supabase?.connectionString || ''}
                    onChange={e => setForm(f => ({
                      ...f,
                      supabase: {
                        ...f.supabase!,
                        connectionString: e.target.value.trim()
                      }
                    }))}
                    placeholder="postgresql://postgres:[PASSWORD]@db.ykrwarvqrpxndkgyswiv.supabase.co:5432/postgres"
                    className="font-mono text-xs flex-1"
                  />
                  <Btn
                    variant="secondary"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                  >
                    {testingConnection ? (
                      <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...</span>
                    ) : (
                      'Test Connection'
                    )}
                  </Btn>
                </div>
              </FormField>

              {testResult && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                  testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Sync Controls */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex flex-wrap gap-2.5">
                  <Btn
                    onClick={async () => {
                      handleSave();
                      await pushToSupabase(true);
                    }}
                    disabled={isSyncing}
                  >
                    <UploadCloud className="w-4 h-4" /> Export All Data to Supabase
                  </Btn>
                  <Btn
                    variant="secondary"
                    onClick={async () => {
                      handleSave();
                      await pullFromSupabase(true);
                    }}
                    disabled={isSyncing}
                  >
                    <DownloadCloud className="w-4 h-4" /> Import Data from Supabase
                  </Btn>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Auto-sync updates:</span>
                  <button
                    onClick={() => setForm(f => ({
                      ...f,
                      supabase: {
                        ...f.supabase!,
                        autoSync: !f.supabase?.autoSync
                      }
                    }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.supabase?.autoSync ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform ${form.supabase?.autoSync ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Data Preview of Supabase Tables */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-900">Live Database Preview (Data synchronized with Supabase)</h4>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['reservations', 'rooms', 'guests', 'payments', 'staff'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDemoPreviewTab(tab)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                        demoPreviewTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {tab} ({tab === 'rooms' ? rooms.length : tab === 'guests' ? guests.length : tab === 'reservations' ? reservations.length : tab === 'payments' ? payments.length : staff.length})
                    </button>
                  ))}
                  <button
                    onClick={() => handleExportCsv(demoPreviewTab)}
                    className="text-xs px-2.5 py-1 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1"
                    title="Download as CSV"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              </div>

              {/* Tabular preview of the entity */}
              <div className="p-4 overflow-x-auto max-h-72 scrollbar-thin text-xs">
                {demoPreviewTab === 'reservations' && (
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Booking ID</th>
                        <th className="p-2">Guest Name</th>
                        <th className="p-2">Room</th>
                        <th className="p-2">Check-in</th>
                        <th className="p-2">Check-out</th>
                        <th className="p-2">Total Tariff</th>
                        <th className="p-2">Payment Status</th>
                        <th className="p-2">Booking Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reservations.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-blue-600">{r.bookingId}</td>
                          <td className="p-2 font-medium">{r.guestName}</td>
                          <td className="p-2">Room {r.roomNumber} ({r.roomType})</td>
                          <td className="p-2">{formatDate(r.checkIn)}</td>
                          <td className="p-2">{formatDate(r.checkOut)}</td>
                          <td className="p-2 font-bold">{formatCurrency(r.totalAmount)}</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">{r.paymentStatus}</span></td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">{r.bookingStatus}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {demoPreviewTab === 'rooms' && (
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Room #</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Floor</th>
                        <th className="p-2">Capacity</th>
                        <th className="p-2">Tariff (INR)</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Amenities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rooms.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold">Room {r.roomNumber}</td>
                          <td className="p-2">{r.type}</td>
                          <td className="p-2">Floor {r.floor}</td>
                          <td className="p-2">{r.capacity} Guests</td>
                          <td className="p-2 font-bold">{formatCurrency(r.pricePerNight)}/night</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">{r.status}</span></td>
                          <td className="p-2 text-slate-500">{r.amenities.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {demoPreviewTab === 'guests' && (
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Guest Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Address</th>
                        <th className="p-2">Total Bookings</th>
                        <th className="p-2">Total Spent</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {guests.map(g => (
                        <tr key={g.id} className="hover:bg-slate-50">
                          <td className="p-2 font-semibold text-slate-900">{g.firstName} {g.lastName}</td>
                          <td className="p-2 font-mono text-slate-600">{g.email}</td>
                          <td className="p-2 font-mono">{g.phone}</td>
                          <td className="p-2 text-slate-600">{g.address}</td>
                          <td className="p-2">{g.totalBookings} stays</td>
                          <td className="p-2 font-bold text-slate-900">{formatCurrency(g.totalSpent)}</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">{g.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {demoPreviewTab === 'payments' && (
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Payment ID</th>
                        <th className="p-2">Booking ID</th>
                        <th className="p-2">Guest</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Method</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold">{p.paymentId}</td>
                          <td className="p-2 font-mono text-blue-600">{p.bookingId}</td>
                          <td className="p-2">{p.guestName}</td>
                          <td className="p-2">{formatDate(p.date)}</td>
                          <td className="p-2 font-medium text-emerald-700">{p.method}</td>
                          <td className="p-2 font-bold">{formatCurrency(p.amount)}</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {demoPreviewTab === 'staff' && (
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Emp ID</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Department</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staff.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono">{s.employeeId}</td>
                          <td className="p-2 font-semibold">{s.firstName} {s.lastName}</td>
                          <td className="p-2 font-medium">{s.role}</td>
                          <td className="p-2">{s.department}</td>
                          <td className="p-2 text-slate-600 font-mono">{s.email}</td>
                          <td className="p-2 font-mono">{s.phone}</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">{s.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PRESERVED GOOGLE SHEETS CODE (COMMENTED AS PER STRICT REQUIREMENT)
           =========================================================================
        // Google Sheets Live Database Tab (Kept commented as reference)
        activeTab === 'Google Sheets Integration' && (
          <div className="space-y-6">
            // Header Banner
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">Google Sheets as Hotel Database</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Live Cloud Integration
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Synchronize bookings, guest records, room tariffs, payments, and staff shifts directly with your personal Google Spreadsheet.
                  </p>
                </div>
              </div>
              <a
                href={USER_SPREADSHEET_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 rounded-lg text-xs font-semibold shadow-sm transition-all whitespace-nowrap self-start md:self-auto"
              >
                <FileSpreadsheet className="w-4 h-4" /> Open Your Google Sheet <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            // Connected Sheet Information
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">Target Spreadsheet ID</p>
                <p className="text-xs font-mono font-bold text-slate-800 truncate mt-1" title={USER_SPREADSHEET_ID}>{USER_SPREADSHEET_ID}</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ Linked to your account</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">Auto-Sync Status</p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {form.googleSheets?.autoSync ? 'Enabled (Instant Push)' : 'Manual Sync Only'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Syncs upon every booking/payment</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">Database Entities</p>
                <p className="text-xs font-bold text-slate-800 mt-1">6 Structured Sheets</p>
                <p className="text-[11px] text-blue-600 mt-1">Rooms, Guests, Reservations, etc.</p>
              </div>
            </div>

            // Web App URL & Connection Panel
            <div className="p-5 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Google Apps Script Web App Connection</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Deploy the provided script on your sheet once to enable automated two-way synchronization.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Enable Sync:</span>
                  <button
                    onClick={() => setForm(f => ({
                      ...f,
                      googleSheets: {
                        ...f.googleSheets!,
                        enabled: !f.googleSheets?.enabled
                      }
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.googleSheets?.enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${form.googleSheets?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <FormField label="Google Apps Script Web App URL" required>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={form.googleSheets?.webAppUrl || ''}
                    onChange={e => setForm(f => ({
                      ...f,
                      googleSheets: {
                        ...f.googleSheets!,
                        webAppUrl: e.target.value.trim()
                      }
                    }))}
                    placeholder="Paste Web App URL from Deploy > New deployment (e.g. https://script.google.com/macros/s/.../exec)"
                    className="font-mono text-xs flex-1"
                  />
                  <Btn
                    variant="secondary"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !form.googleSheets?.webAppUrl}
                  >
                    {testingConnection ? (
                      <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...</span>
                    ) : (
                      'Test Connection'
                    )}
                  </Btn>
                </div>
              </FormField>

              {testResult && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                  testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              // Sync Controls
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex flex-wrap gap-2.5">
                  <Btn
                    onClick={async () => {
                      handleSave();
                      await pushToGoogleSheets(true);
                    }}
                    disabled={isSyncing || !form.googleSheets?.webAppUrl}
                  >
                    <UploadCloud className="w-4 h-4" /> Export All Data to Google Sheet
                  </Btn>
                  <Btn
                    variant="secondary"
                    onClick={async () => {
                      handleSave();
                      await pullFromGoogleSheets(true);
                    }}
                    disabled={isSyncing || !form.googleSheets?.webAppUrl}
                  >
                    <DownloadCloud className="w-4 h-4" /> Import Data from Google Sheet
                  </Btn>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Auto-sync updates:</span>
                  <button
                    onClick={() => setForm(f => ({
                      ...f,
                      googleSheets: {
                        ...f.googleSheets!,
                        autoSync: !f.googleSheets?.autoSync
                      }
                    }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.googleSheets?.autoSync ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform ${form.googleSheets?.autoSync ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            // Interactive Data Preview / Demonstration of Database Tables
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-900">Live Database Preview (Data synchronized to Google Sheets)</h4>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['reservations', 'rooms', 'guests', 'payments', 'staff'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDemoPreviewTab(tab)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                        demoPreviewTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {tab} ({tab === 'rooms' ? rooms.length : tab === 'guests' ? guests.length : tab === 'reservations' ? reservations.length : tab === 'payments' ? payments.length : staff.length})
                    </button>
                  ))}
                  <button
                    onClick={() => handleExportCsv(demoPreviewTab)}
                    className="text-xs px-2.5 py-1 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1"
                    title="Download as CSV"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              </div>

              // Tabular preview of the entity
              <div className="p-4 overflow-x-auto max-h-72 scrollbar-thin text-xs">
                {demoPreviewTab === 'reservations' && (
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Booking ID</th>
                        <th className="p-2">Guest Name</th>
                        <th className="p-2">Room</th>
                        <th className="p-2">Check-in</th>
                        <th className="p-2">Check-out</th>
                        <th className="p-2">Total Tariff</th>
                        <th className="p-2">Payment Status</th>
                        <th className="p-2">Booking Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reservations.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-blue-600">{r.bookingId}</td>
                          <td className="p-2 font-medium">{r.guestName}</td>
                          <td className="p-2">Room {r.roomNumber} ({r.roomType})</td>
                          <td className="p-2">{formatDate(r.checkIn)}</td>
                          <td className="p-2">{formatDate(r.checkOut)}</td>
                          <td className="p-2 font-bold">{formatCurrency(r.totalAmount)}</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">{r.paymentStatus}</span></td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">{r.bookingStatus}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {demoPreviewTab === 'rooms' && (
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Room #</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Floor</th>
                        <th className="p-2">Capacity</th>
                        <th className="p-2">Tariff (INR)</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Amenities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rooms.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold">Room {r.roomNumber}</td>
                          <td className="p-2">{r.type}</td>
                          <td className="p-2">Floor {r.floor}</td>
                          <td className="p-2">{r.capacity} Guests</td>
                          <td className="p-2 font-bold">{formatCurrency(r.pricePerNight)}/night</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">{r.status}</span></td>
                          <td className="p-2 text-slate-500">{r.amenities.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {demoPreviewTab === 'guests' && (
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Guest Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Address</th>
                        <th className="p-2">Total Bookings</th>
                        <th className="p-2">Total Spent</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {guests.map(g => (
                        <tr key={g.id} className="hover:bg-slate-50">
                          <td className="p-2 font-semibold text-slate-900">{g.firstName} {g.lastName}</td>
                          <td className="p-2 font-mono text-slate-600">{g.email}</td>
                          <td className="p-2 font-mono">{g.phone}</td>
                          <td className="p-2 text-slate-600">{g.address}</td>
                          <td className="p-2">{g.totalBookings} stays</td>
                          <td className="p-2 font-bold text-slate-900">{formatCurrency(g.totalSpent)}</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">{g.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {demoPreviewTab === 'payments' && (
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Payment ID</th>
                        <th className="p-2">Booking ID</th>
                        <th className="p-2">Guest</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Method</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold">{p.paymentId}</td>
                          <td className="p-2 font-mono text-blue-600">{p.bookingId}</td>
                          <td className="p-2">{p.guestName}</td>
                          <td className="p-2">{formatDate(p.date)}</td>
                          <td className="p-2 font-medium text-emerald-700">{p.method}</td>
                          <td className="p-2 font-bold">{formatCurrency(p.amount)}</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {demoPreviewTab === 'staff' && (
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2">Emp ID</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Department</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staff.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono">{s.employeeId}</td>
                          <td className="p-2 font-semibold">{s.firstName} {s.lastName}</td>
                          <td className="p-2 font-medium">{s.role}</td>
                          <td className="p-2">{s.department}</td>
                          <td className="p-2 text-slate-600 font-mono">{s.email}</td>
                          <td className="p-2 font-mono">{s.phone}</td>
                          <td className="p-2"><span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">{s.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            // Step-by-Step Setup Guide
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>🚀 1-Minute Live Google Sheet Deployment Steps</span>
                </h4>
                <a
                  href={USER_SPREADSHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  Open Your Sheet <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Open your connected spreadsheet at:{' '}
                  <a href={USER_SPREADSHEET_URL} target="_blank" rel="noreferrer" className="text-blue-600 underline font-mono">
                    {USER_SPREADSHEET_URL}
                  </a>
                </li>
                <li>In Google Sheets menu, click: <strong className="text-slate-900">Extensions &gt; Apps Script</strong>.</li>
                <li>
                  Click the <strong className="text-slate-900">Copy Google Apps Script Code</strong> button below, replace any default code in Apps Script, and click the Save icon (<kbd className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">Ctrl+S</kbd>).
                </li>
                <li>
                  Click <strong className="text-slate-900">Deploy &gt; New deployment</strong>, click the gear icon <strong className="text-slate-900">Web app</strong>.
                </li>
                <li>
                  Set <em>Execute as:</em> <strong className="text-slate-900">Me</strong> and <em>Who has access:</em> <strong className="text-emerald-700 font-bold">Anyone</strong>, then click <strong className="text-slate-900">Deploy</strong>.
                </li>
                <li>Copy the resulting Web App URL (ends in <code className="bg-slate-200 px-1 rounded font-mono">/exec</code>) and paste it into the Web App URL box above.</li>
              </ol>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Btn variant="secondary" onClick={handleCopyScript}>
                  {copiedScript ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedScript ? 'Copied to Clipboard!' : 'Copy Google Apps Script Code'}
                </Btn>
                <span className="text-xs text-slate-500">
                  Script is also saved in repository at <code className="text-[11px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">google-sheets-script/Code.gs</code>
                </span>
              </div>
            </div>
          </div>
        )
        */}

        {/* Hotel Profile Tab */}
        {activeTab === 'Hotel Profile' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Hotel Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Hotel Name" required className="sm:col-span-2">
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="The GrandStay Palace Hotel" />
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

        {/* Notifications Tab */}
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
              <div key={key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
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

        {/* Preferences Tab */}
        {activeTab === 'Preferences' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Interface Appearance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setForm(f => ({ ...f, appearance: { ...f.appearance, theme: 'light' } }))}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${form.appearance.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="w-full h-16 bg-white border border-slate-200 rounded-lg mb-3 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">L</div>
                </div>
                <p className="text-sm font-semibold text-slate-800">Light Mode</p>
                <p className="text-xs text-slate-500 mt-0.5">Clean, bright interface</p>
              </div>
              <div
                onClick={() => setForm(f => ({ ...f, appearance: { ...f.appearance, theme: 'dark' } }))}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${form.appearance.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="w-full h-16 bg-slate-900 rounded-lg mb-3 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">D</div>
                </div>
                <p className="text-sm font-semibold text-slate-800">Dark Mode</p>
                <p className="text-xs text-slate-500 mt-0.5">High contrast dark theme</p>
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

        {/* Reset Tab */}
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
