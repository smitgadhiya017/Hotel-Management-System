import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room, Guest, Reservation, Payment, StaffMember, HotelSettings, Notification
} from '../types';
import {
  INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_RESERVATIONS, INITIAL_PAYMENTS,
  INITIAL_STAFF, INITIAL_SETTINGS, INITIAL_NOTIFICATIONS
} from '../data/mockData';
import {
  fetchGoogleSheetData, syncAllToGoogleSheet, syncEntityToGoogleSheet
} from '../services/googleSheets';
import { toast } from 'sonner';

const STORAGE_KEYS = {
  rooms: 'grandstay_rooms',
  guests: 'grandstay_guests',
  reservations: 'grandstay_reservations',
  payments: 'grandstay_payments',
  staff: 'grandstay_staff',
  settings: 'grandstay_settings',
  notifications: 'grandstay_notifications',
  seeded: 'grandstay_seeded',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

// Seed on first launch or version upgrade
const CURRENT_SEED_VERSION = 'grandstay_inr_v1';

function seedIfNeeded() {
  const currentVersion = localStorage.getItem(STORAGE_KEYS.seeded);
  if (currentVersion !== CURRENT_SEED_VERSION) {
    saveToStorage(STORAGE_KEYS.rooms, INITIAL_ROOMS);
    saveToStorage(STORAGE_KEYS.guests, INITIAL_GUESTS);
    saveToStorage(STORAGE_KEYS.reservations, INITIAL_RESERVATIONS);
    saveToStorage(STORAGE_KEYS.payments, INITIAL_PAYMENTS);
    saveToStorage(STORAGE_KEYS.staff, INITIAL_STAFF);
    saveToStorage(STORAGE_KEYS.settings, INITIAL_SETTINGS);
    saveToStorage(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEYS.seeded, CURRENT_SEED_VERSION);
  }
}

seedIfNeeded();

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>(() => loadFromStorage(STORAGE_KEYS.rooms, INITIAL_ROOMS));

  const saveRooms = useCallback((updated: Room[]) => {
    setRooms(updated);
    saveToStorage(STORAGE_KEYS.rooms, updated);
  }, []);

  const addRoom = useCallback((room: Room) => {
    setRooms(prev => { const next = [...prev, room]; saveToStorage(STORAGE_KEYS.rooms, next); return next; });
  }, []);

  const updateRoom = useCallback((room: Room) => {
    setRooms(prev => { const next = prev.map(r => r.id === room.id ? room : r); saveToStorage(STORAGE_KEYS.rooms, next); return next; });
  }, []);

  const deleteRoom = useCallback((id: string) => {
    setRooms(prev => { const next = prev.filter(r => r.id !== id); saveToStorage(STORAGE_KEYS.rooms, next); return next; });
  }, []);

  return { rooms, addRoom, updateRoom, deleteRoom, saveRooms };
}

export function useGuests() {
  const [guests, setGuests] = useState<Guest[]>(() => loadFromStorage(STORAGE_KEYS.guests, INITIAL_GUESTS));

  const saveGuests = useCallback((updated: Guest[]) => {
    setGuests(updated);
    saveToStorage(STORAGE_KEYS.guests, updated);
  }, []);

  const addGuest = useCallback((guest: Guest) => {
    setGuests(prev => { const next = [...prev, guest]; saveToStorage(STORAGE_KEYS.guests, next); return next; });
  }, []);

  const updateGuest = useCallback((guest: Guest) => {
    setGuests(prev => { const next = prev.map(g => g.id === guest.id ? guest : g); saveToStorage(STORAGE_KEYS.guests, next); return next; });
  }, []);

  const deleteGuest = useCallback((id: string) => {
    setGuests(prev => { const next = prev.filter(g => g.id !== id); saveToStorage(STORAGE_KEYS.guests, next); return next; });
  }, []);

  return { guests, addGuest, updateGuest, deleteGuest, saveGuests };
}

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>(() => loadFromStorage(STORAGE_KEYS.reservations, INITIAL_RESERVATIONS));

  const saveReservations = useCallback((updated: Reservation[]) => {
    setReservations(updated);
    saveToStorage(STORAGE_KEYS.reservations, updated);
  }, []);

  const addReservation = useCallback((res: Reservation) => {
    setReservations(prev => { const next = [...prev, res]; saveToStorage(STORAGE_KEYS.reservations, next); return next; });
  }, []);

  const updateReservation = useCallback((res: Reservation) => {
    setReservations(prev => { const next = prev.map(r => r.id === res.id ? res : r); saveToStorage(STORAGE_KEYS.reservations, next); return next; });
  }, []);

  const deleteReservation = useCallback((id: string) => {
    setReservations(prev => { const next = prev.filter(r => r.id !== id); saveToStorage(STORAGE_KEYS.reservations, next); return next; });
  }, []);

  return { reservations, addReservation, updateReservation, deleteReservation, saveReservations };
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage(STORAGE_KEYS.payments, INITIAL_PAYMENTS));

  const savePayments = useCallback((updated: Payment[]) => {
    setPayments(updated);
    saveToStorage(STORAGE_KEYS.payments, updated);
  }, []);

  const addPayment = useCallback((p: Payment) => {
    setPayments(prev => { const next = [...prev, p]; saveToStorage(STORAGE_KEYS.payments, next); return next; });
  }, []);

  const updatePayment = useCallback((p: Payment) => {
    setPayments(prev => { const next = prev.map(pay => pay.id === p.id ? p : pay); saveToStorage(STORAGE_KEYS.payments, next); return next; });
  }, []);

  return { payments, addPayment, updatePayment, savePayments };
}

export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>(() => loadFromStorage(STORAGE_KEYS.staff, INITIAL_STAFF));

  const saveStaff = useCallback((updated: StaffMember[]) => {
    setStaff(updated);
    saveToStorage(STORAGE_KEYS.staff, updated);
  }, []);

  const addStaff = useCallback((s: StaffMember) => {
    setStaff(prev => { const next = [...prev, s]; saveToStorage(STORAGE_KEYS.staff, next); return next; });
  }, []);

  const updateStaff = useCallback((s: StaffMember) => {
    setStaff(prev => { const next = prev.map(m => m.id === s.id ? s : m); saveToStorage(STORAGE_KEYS.staff, next); return next; });
  }, []);

  const deleteStaff = useCallback((id: string) => {
    setStaff(prev => { const next = prev.filter(m => m.id !== id); saveToStorage(STORAGE_KEYS.staff, next); return next; });
  }, []);

  return { staff, addStaff, updateStaff, deleteStaff, saveStaff };
}

export function useSettings() {
  const [settings, setSettings] = useState<HotelSettings>(() => loadFromStorage(STORAGE_KEYS.settings, INITIAL_SETTINGS));

  const updateSettings = useCallback((s: HotelSettings) => {
    setSettings(s);
    saveToStorage(STORAGE_KEYS.settings, s);
  }, []);

  return { settings, updateSettings };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS));

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      saveToStorage(STORAGE_KEYS.notifications, next);
      return next;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveToStorage(STORAGE_KEYS.notifications, next);
      return next;
    });
  }, []);

  const addNotification = useCallback((n: Notification) => {
    setNotifications(prev => {
      const next = [n, ...prev];
      saveToStorage(STORAGE_KEYS.notifications, next);
      return next;
    });
  }, []);

  return { notifications, markAllRead, markRead, addNotification };
}

export function resetDemoData() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  window.location.reload();
}

export function useDashboardMetrics(rooms: Room[], reservations: Reservation[], payments: Payment[]) {
  const today = new Date().toISOString().split('T')[0];

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'Available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const reservedRooms = rooms.filter(r => r.status === 'Reserved').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance').length;
  const todayRevenue = payments.filter(p => p.date === today && p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalReservations = reservations.length;

  const todayArrivals = reservations.filter(r => r.checkIn === today && r.bookingStatus === 'Confirmed');
  const todayDepartures = reservations.filter(r => r.checkOut === today && r.bookingStatus === 'Checked In');

  return {
    totalRooms, availableRooms, occupiedRooms, reservedRooms, maintenanceRooms,
    todayRevenue, totalReservations, todayArrivals, todayDepartures,
  };
}

export function useAppData() {
  const { rooms, addRoom: rawAddRoom, updateRoom: rawUpdateRoom, deleteRoom: rawDeleteRoom, saveRooms } = useRooms();
  const { guests, addGuest: rawAddGuest, updateGuest: rawUpdateGuest, deleteGuest: rawDeleteGuest, saveGuests } = useGuests();
  const { reservations, addReservation: rawAddRes, updateReservation: rawUpdateRes, deleteReservation: rawDeleteRes, saveReservations } = useReservations();
  const { payments, addPayment: rawAddPay, updatePayment: rawUpdatePay, savePayments } = usePayments();
  const { staff, addStaff: rawAddStaff, updateStaff: rawUpdateStaff, deleteStaff: rawDeleteStaff, saveStaff } = useStaff();
  const { settings, updateSettings } = useSettings();
  const { notifications, markAllRead, markRead, addNotification } = useNotifications();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const initialLoadedRef = useRef(false);

  // Helper to trigger background sync if Google Sheets is enabled
  const triggerAutoSync = useCallback((entity: 'rooms' | 'guests' | 'reservations' | 'payments' | 'staff' | 'settings', data: unknown) => {
    if (settings.googleSheets?.enabled && settings.googleSheets?.autoSync && settings.googleSheets?.webAppUrl) {
      syncEntityToGoogleSheet(settings.googleSheets.webAppUrl, entity, data).then(res => {
        if (res.status === 'success') {
          setSyncStatus('synced');
        }
      });
    }
  }, [settings.googleSheets]);

  // Intercept mutations to auto-sync to Google Sheets
  const addRoom = useCallback((room: Room) => {
    rawAddRoom(room);
    triggerAutoSync('rooms', [...rooms, room]);
  }, [rawAddRoom, rooms, triggerAutoSync]);

  const updateRoom = useCallback((room: Room) => {
    rawUpdateRoom(room);
    triggerAutoSync('rooms', rooms.map(r => r.id === room.id ? room : r));
  }, [rawUpdateRoom, rooms, triggerAutoSync]);

  const deleteRoom = useCallback((id: string) => {
    rawDeleteRoom(id);
    triggerAutoSync('rooms', rooms.filter(r => r.id !== id));
  }, [rawDeleteRoom, rooms, triggerAutoSync]);

  const addGuest = useCallback((guest: Guest) => {
    rawAddGuest(guest);
    triggerAutoSync('guests', [...guests, guest]);
  }, [rawAddGuest, guests, triggerAutoSync]);

  const updateGuest = useCallback((guest: Guest) => {
    rawUpdateGuest(guest);
    triggerAutoSync('guests', guests.map(g => g.id === guest.id ? guest : g));
  }, [rawUpdateGuest, guests, triggerAutoSync]);

  const deleteGuest = useCallback((id: string) => {
    rawDeleteGuest(id);
    triggerAutoSync('guests', guests.filter(g => g.id !== id));
  }, [rawDeleteGuest, guests, triggerAutoSync]);

  const addReservation = useCallback((res: Reservation) => {
    rawAddRes(res);
    triggerAutoSync('reservations', [...reservations, res]);
  }, [rawAddRes, reservations, triggerAutoSync]);

  const updateReservation = useCallback((res: Reservation) => {
    rawUpdateRes(res);
    triggerAutoSync('reservations', reservations.map(r => r.id === res.id ? res : r));
  }, [rawUpdateRes, reservations, triggerAutoSync]);

  const deleteReservation = useCallback((id: string) => {
    rawDeleteRes(id);
    triggerAutoSync('reservations', reservations.filter(r => r.id !== id));
  }, [rawDeleteRes, reservations, triggerAutoSync]);

  const addPayment = useCallback((pay: Payment) => {
    rawAddPay(pay);
    triggerAutoSync('payments', [...payments, pay]);
  }, [rawAddPay, payments, triggerAutoSync]);

  const updatePayment = useCallback((pay: Payment) => {
    rawUpdatePay(pay);
    triggerAutoSync('payments', payments.map(p => p.id === pay.id ? pay : p));
  }, [rawUpdatePay, payments, triggerAutoSync]);

  const addStaff = useCallback((st: StaffMember) => {
    rawAddStaff(st);
    triggerAutoSync('staff', [...staff, st]);
  }, [rawAddStaff, staff, triggerAutoSync]);

  const updateStaff = useCallback((st: StaffMember) => {
    rawUpdateStaff(st);
    triggerAutoSync('staff', staff.map(s => s.id === st.id ? st : s));
  }, [rawUpdateStaff, staff, triggerAutoSync]);

  const deleteStaff = useCallback((id: string) => {
    rawDeleteStaff(id);
    triggerAutoSync('staff', staff.filter(s => s.id !== id));
  }, [rawDeleteStaff, staff, triggerAutoSync]);

  // Pull all data from Google Sheets into local state
  const pullFromGoogleSheets = useCallback(async (notify = true) => {
    if (!settings.googleSheets?.webAppUrl) {
      if (notify) toast.error('Google Sheets URL is not configured');
      return false;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const response = await fetchGoogleSheetData(settings.googleSheets.webAppUrl);
      if (response.status === 'success' && response.data) {
        const { rooms: r, guests: g, reservations: res, payments: p, staff: s } = response.data;
        if (r && Array.isArray(r) && r.length > 0) saveRooms(r);
        if (g && Array.isArray(g) && g.length > 0) saveGuests(g);
        if (res && Array.isArray(res) && res.length > 0) saveReservations(res);
        if (p && Array.isArray(p) && p.length > 0) savePayments(p);
        if (s && Array.isArray(s) && s.length > 0) saveStaff(s);

        const now = new Date().toISOString();
        updateSettings({
          ...settings,
          googleSheets: {
            ...settings.googleSheets,
            lastSyncedAt: now,
          }
        });

        setSyncStatus('synced');
        if (notify) toast.success('Successfully imported data from Google Sheets!');
        return true;
      } else {
        throw new Error(response.message || 'No valid data returned from Google Sheets');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setSyncStatus('error');
      setSyncError(message);
      if (notify) toast.error(`Google Sheets sync failed: ${message}`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [settings, saveRooms, saveGuests, saveReservations, savePayments, saveStaff, updateSettings]);

  // Push all local data to Google Sheets
  const pushToGoogleSheets = useCallback(async (notify = true) => {
    if (!settings.googleSheets?.webAppUrl) {
      if (notify) toast.error('Google Sheets URL is not configured');
      return false;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      await syncAllToGoogleSheet(settings.googleSheets.webAppUrl, {
        rooms,
        guests,
        reservations,
        payments,
        staff,
        settings,
      });

      const now = new Date().toISOString();
      updateSettings({
        ...settings,
        googleSheets: {
          ...settings.googleSheets,
          lastSyncedAt: now,
        }
      });

      setSyncStatus('synced');
      if (notify) toast.success('Successfully exported all data to Google Sheets!');
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setSyncStatus('error');
      setSyncError(message);
      if (notify) toast.error(`Export failed: ${message}`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [settings, rooms, guests, reservations, payments, staff, updateSettings]);

  // Initial auto-pull on mount if enabled
  useEffect(() => {
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;

    if (settings.googleSheets?.enabled && settings.googleSheets?.webAppUrl) {
      pullFromGoogleSheets(false);
    }
  }, [settings.googleSheets?.enabled, settings.googleSheets?.webAppUrl, pullFromGoogleSheets]);

  const metrics = useDashboardMetrics(rooms, reservations, payments);

  return {
    rooms, addRoom, updateRoom, deleteRoom,
    guests, addGuest, updateGuest, deleteGuest,
    reservations, addReservation, updateReservation, deleteReservation,
    payments, addPayment, updatePayment,
    staff, addStaff, updateStaff, deleteStaff,
    settings, updateSettings,
    notifications, markAllRead, markRead, addNotification,
    metrics,
    // Google Sheets Sync Properties & Methods
    isSyncing,
    syncStatus,
    syncError,
    pullFromGoogleSheets,
    pushToGoogleSheets,
  };
}

export type AppData = ReturnType<typeof useAppData>;
