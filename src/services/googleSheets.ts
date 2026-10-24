import { Room, Guest, Reservation, Payment, StaffMember, HotelSettings } from '../types';

export const USER_SPREADSHEET_ID = '1lC114sOdG_OCAaTQi6sWCkMonWINXdEpkmnfYfqC8tw';
export const USER_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${USER_SPREADSHEET_ID}/edit`;

export interface GoogleSheetSyncPayload {
  rooms?: Room[];
  guests?: Guest[];
  reservations?: Reservation[];
  payments?: Payment[];
  staff?: StaffMember[];
  settings?: HotelSettings;
}

export interface GoogleSheetResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  timestamp?: string;
}

/**
 * Fetch all hotel datasets from Google Sheets Web App.
 */
export async function fetchGoogleSheetData(webAppUrl: string): Promise<GoogleSheetResponse<GoogleSheetSyncPayload>> {
  if (!webAppUrl || !webAppUrl.trim()) {
    throw new Error('Google Sheets Web App URL is not configured.');
  }

  const cleanUrl = webAppUrl.trim();
  const res = await fetch(cleanUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Google Sheets responded with HTTP status ${res.status}`);
  }

  const json = await res.json();
  if (json.status === 'error') {
    throw new Error(json.message || 'Error received from Google Sheets API');
  }

  return json;
}

/**
 * Push all local hotel datasets to Google Sheets Web App.
 */
export async function syncAllToGoogleSheet(
  webAppUrl: string,
  payload: GoogleSheetSyncPayload
): Promise<GoogleSheetResponse> {
  if (!webAppUrl || !webAppUrl.trim()) {
    throw new Error('Google Sheets Web App URL is not configured.');
  }

  const cleanUrl = webAppUrl.trim();

  // Send request with text/plain to prevent CORS preflight issues with Google Apps Script
  const res = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'syncAll',
      data: payload,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Sheets responded with HTTP status ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    return { status: 'success', message: 'Synchronized with Google Sheets' };
  }
}

/**
 * Push an individual entity (e.g. 'reservations', 'rooms', 'guests') to Google Sheets.
 */
export async function syncEntityToGoogleSheet(
  webAppUrl: string,
  entity: 'rooms' | 'guests' | 'reservations' | 'payments' | 'staff' | 'settings',
  data: unknown
): Promise<GoogleSheetResponse> {
  if (!webAppUrl || !webAppUrl.trim()) return { status: 'error', message: 'No URL configured' };

  try {
    const res = await fetch(webAppUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'syncEntity',
        entity,
        data,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Background sync failed for ${entity}:`, message);
    return { status: 'error', message };
  }
}

/**
 * Quick ping test to verify the Web App URL is reachable and working.
 */
export async function testGoogleSheetConnection(webAppUrl: string): Promise<{ success: boolean; message: string }> {
  try {
    const result = await fetchGoogleSheetData(webAppUrl);
    if (result.status === 'success') {
      const counts = result.data ? {
        rooms: result.data.rooms?.length ?? 0,
        guests: result.data.guests?.length ?? 0,
        reservations: result.data.reservations?.length ?? 0,
      } : { rooms: 0, guests: 0, reservations: 0 };

      return {
        success: true,
        message: `Connected successfully to spreadsheet! Found ${counts.rooms} rooms, ${counts.guests} guests, ${counts.reservations} reservations.`,
      };
    }
    return { success: false, message: result.message || 'Unknown response from Google Sheets.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Failed to connect: ${msg}. Please ensure your Web App is deployed with "Who has access: Anyone".`,
    };
  }
}
