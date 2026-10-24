import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Room, Guest, Reservation, Payment, StaffMember, HotelSettings } from '../types';
import { API_BASE_URL } from '../config/api';

export const SUPABASE_URL = 'https://ykrwarvqrpxndkgyswiv.supabase.co';
export const SUPABASE_HOST = 'db.ykrwarvqrpxndkgyswiv.supabase.co';
export const SUPABASE_PORT = 5432;
export const SUPABASE_DATABASE = 'postgres';
export const SUPABASE_USER = 'postgres';
export const SUPABASE_CONNECTION_STRING = 'postgresql://postgres:Smitgadhiya@db.ykrwarvqrpxndkgyswiv.supabase.co:5432/postgres';

export interface SupabaseSyncPayload {
  rooms?: Room[];
  guests?: Guest[];
  reservations?: Reservation[];
  payments?: Payment[];
  staff?: StaffMember[];
  settings?: HotelSettings;
}

export interface SupabaseResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  timestamp?: string;
}

let cachedClient: SupabaseClient | null = null;
let currentKey = '';

export function getSupabaseClient(url = SUPABASE_URL, key = ''): SupabaseClient | null {
  if (!key || !key.trim()) return null;
  if (!cachedClient || currentKey !== key) {
    cachedClient = createClient(url, key);
    currentKey = key;
  }
  return cachedClient;
}

/**
 * Fetch all hotel datasets from Supabase.
 * Uses @supabase/supabase-js if anonKey is present, otherwise uses direct backend endpoint /api/supabase/all.
 */
export async function fetchSupabaseData(
  url = SUPABASE_URL,
  anonKey = ''
): Promise<SupabaseResponse<SupabaseSyncPayload>> {
  const client = getSupabaseClient(url, anonKey);

  if (client) {
    try {
      const [roomsRes, guestsRes, reservationsRes, paymentsRes, staffRes, settingsRes] = await Promise.all([
        client.from('rooms').select('*'),
        client.from('guests').select('*'),
        client.from('reservations').select('*'),
        client.from('payments').select('*'),
        client.from('staff').select('*'),
        client.from('hotel_settings').select('*').eq('id', 'current').maybeSingle(),
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (guestsRes.error) throw guestsRes.error;
      if (reservationsRes.error) throw reservationsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (staffRes.error) throw staffRes.error;

      return {
        status: 'success',
        timestamp: new Date().toISOString(),
        data: {
          rooms: roomsRes.data as Room[],
          guests: guestsRes.data as Guest[],
          reservations: reservationsRes.data as Reservation[],
          payments: paymentsRes.data as Payment[],
          staff: staffRes.data as StaffMember[],
          settings: settingsRes.data?.data as HotelSettings,
        },
      };
    } catch (err: unknown) {
      console.warn('Supabase JS fetch error, falling back to local API:', err);
    }
  }

  // Fallback to local dev API connected directly to Supabase Postgres
  const res = await fetch(`${API_BASE_URL}/api/supabase/all`);
  if (!res.ok) {
    throw new Error(`Supabase query failed with HTTP status ${res.status}`);
  }
  return await res.json();
}

/**
 * Sync all datasets to Supabase.
 */
export async function syncAllToSupabase(
  payload: SupabaseSyncPayload,
  url = SUPABASE_URL,
  anonKey = ''
): Promise<SupabaseResponse> {
  const client = getSupabaseClient(url, anonKey);

  if (client) {
    try {
      if (payload.rooms && payload.rooms.length > 0) {
        const { error } = await client.from('rooms').upsert(payload.rooms);
        if (error) throw error;
      }
      if (payload.guests && payload.guests.length > 0) {
        const { error } = await client.from('guests').upsert(payload.guests);
        if (error) throw error;
      }
      if (payload.reservations && payload.reservations.length > 0) {
        const { error } = await client.from('reservations').upsert(payload.reservations);
        if (error) throw error;
      }
      if (payload.payments && payload.payments.length > 0) {
        const { error } = await client.from('payments').upsert(payload.payments);
        if (error) throw error;
      }
      if (payload.staff && payload.staff.length > 0) {
        const { error } = await client.from('staff').upsert(payload.staff);
        if (error) throw error;
      }
      if (payload.settings) {
        const { error } = await client.from('hotel_settings').upsert({ id: 'current', data: payload.settings });
        if (error) throw error;
      }

      return {
        status: 'success',
        message: 'Successfully synchronized all data to Supabase',
        timestamp: new Date().toISOString(),
      };
    } catch (err: unknown) {
      console.warn('Supabase JS sync error, trying local endpoint:', err);
    }
  }

  // Fallback to local dev API connected directly to Supabase Postgres
  const res = await fetch(`${API_BASE_URL}/api/supabase/syncAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to sync to Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Sync a single entity (e.g. rooms, guests, reservations, payments, staff) to Supabase.
 */
export async function syncEntityToSupabase(
  entity: 'rooms' | 'guests' | 'reservations' | 'payments' | 'staff' | 'settings',
  data: unknown,
  url = SUPABASE_URL,
  anonKey = ''
): Promise<SupabaseResponse> {
  const client = getSupabaseClient(url, anonKey);

  if (client) {
    try {
      const tableName = entity === 'settings' ? 'hotel_settings' : entity;
      if (entity === 'settings') {
        const { error } = await client.from(tableName).upsert({ id: 'current', data });
        if (error) throw error;
      } else if (Array.isArray(data)) {
        const { error } = await client.from(tableName).upsert(data);
        if (error) throw error;
      } else if (data && typeof data === 'object') {
        const { error } = await client.from(tableName).upsert([data]);
        if (error) throw error;
      }

      return { status: 'success', message: `Synced ${entity} to Supabase` };
    } catch (err: unknown) {
      console.warn(`Supabase JS sync failed for ${entity}, falling back:`, err);
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/supabase/entity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity, data }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Background Supabase sync failed for ${entity}:`, message);
    return { status: 'error', message };
  }
}

/**
 * Ping test to verify connection to Supabase database.
 */
export async function testSupabaseConnection(
  url = SUPABASE_URL,
  anonKey = ''
): Promise<{ success: boolean; message: string; counts?: { rooms: number; guests: number; reservations: number; payments: number; staff: number } }> {
  try {
    const client = getSupabaseClient(url, anonKey);

    if (client) {
      const [r, g, res] = await Promise.all([
        client.from('rooms').select('*', { count: 'exact', head: true }),
        client.from('guests').select('*', { count: 'exact', head: true }),
        client.from('reservations').select('*', { count: 'exact', head: true }),
      ]);

      if (r.error) throw r.error;
      const roomsCount = r.count ?? 0;
      const guestsCount = g.count ?? 0;
      const resCount = res.count ?? 0;

      return {
        success: true,
        message: `Connected successfully to Supabase! Found ${roomsCount} rooms, ${guestsCount} guests, ${resCount} reservations.`,
        counts: { rooms: roomsCount, guests: guestsCount, reservations: resCount, payments: 0, staff: 0 },
      };
    }

    // Direct endpoint test
    const response = await fetch(`${API_BASE_URL}/api/supabase/status`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    if (result.status === 'success') {
      const c = result.counts || {};
      return {
        success: true,
        message: `Connected successfully to Supabase PostgreSQL at db.ykrwarvqrpxndkgyswiv.supabase.co! Found ${c.rooms || 0} rooms, ${c.guests || 0} guests, ${c.reservations || 0} reservations.`,
        counts: c,
      };
    }
    return { success: false, message: result.message || 'Unknown response from Supabase.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Failed to connect to Supabase: ${msg}. Please ensure your database credentials and network connection are valid.`,
    };
  }
}
