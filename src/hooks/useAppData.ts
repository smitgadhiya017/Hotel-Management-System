import { useState, useEffect, useCallback } from 'react';
import {
  Room, Guest, Reservation, Payment, StaffMember, HotelSettings, Notification
} from '../types';
import {
  INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_RESERVATIONS, INITIAL_PAYMENTS,
  INITIAL_STAFF, INITIAL_SETTINGS, INITIAL_NOTIFICATIONS
} from '../data/mockData';

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

  const addGuest = useCallback((guest: Guest) => {
    setGuests(prev => { const next = [...prev, guest]; saveToStorage(STORAGE_KEYS.guests, next); return next; });
  }, []);

  const updateGuest = useCallback((guest: Guest) => {
    setGuests(prev => { const next = prev.map(g => g.id === guest.id ? guest : g); saveToStorage(STORAGE_KEYS.guests, next); return next; });
  }, []);

  const deleteGuest = useCallback((id: string) => {
    setGuests(prev => { const next = prev.filter(g => g.id !== id); saveToStorage(STORAGE_KEYS.guests, next); return next; });
  }, []);

  return { guests, addGuest, updateGuest, deleteGuest };
}

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>(() => loadFromStorage(STORAGE_KEYS.reservations, INITIAL_RESERVATIONS));

  const addReservation = useCallback((res: Reservation) => {
    setReservations(prev => { const next = [...prev, res]; saveToStorage(STORAGE_KEYS.reservations, next); return next; });
  }, []);

  const updateReservation = useCallback((res: Reservation) => {
    setReservations(prev => { const next = prev.map(r => r.id === res.id ? res : r); saveToStorage(STORAGE_KEYS.reservations, next); return next; });
  }, []);

  const deleteReservation = useCallback((id: string) => {
    setReservations(prev => { const next = prev.filter(r => r.id !== id); saveToStorage(STORAGE_KEYS.reservations, next); return next; });
  }, []);

  return { reservations, addReservation, updateReservation, deleteReservation };
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage(STORAGE_KEYS.payments, INITIAL_PAYMENTS));

  const addPayment = useCallback((p: Payment) => {
    setPayments(prev => { const next = [...prev, p]; saveToStorage(STORAGE_KEYS.payments, next); return next; });
  }, []);

  const updatePayment = useCallback((p: Payment) => {
    setPayments(prev => { const next = prev.map(pay => pay.id === p.id ? p : pay); saveToStorage(STORAGE_KEYS.payments, next); return next; });
  }, []);

  return { payments, addPayment, updatePayment };
}

export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>(() => loadFromStorage(STORAGE_KEYS.staff, INITIAL_STAFF));

  const addStaff = useCallback((s: StaffMember) => {
    setStaff(prev => { const next = [...prev, s]; saveToStorage(STORAGE_KEYS.staff, next); return next; });
  }, []);

  const updateStaff = useCallback((s: StaffMember) => {
    setStaff(prev => { const next = prev.map(m => m.id === s.id ? s : m); saveToStorage(STORAGE_KEYS.staff, next); return next; });
  }, []);

  const deleteStaff = useCallback((id: string) => {
    setStaff(prev => { const next = prev.filter(m => m.id !== id); saveToStorage(STORAGE_KEYS.staff, next); return next; });
  }, []);

  return { staff, addStaff, updateStaff, deleteStaff };
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
  const { rooms, addRoom, updateRoom, deleteRoom } = useRooms();
  const { guests, addGuest, updateGuest, deleteGuest } = useGuests();
  const { reservations, addReservation, updateReservation, deleteReservation } = useReservations();
  const { payments, addPayment, updatePayment } = usePayments();
  const { staff, addStaff, updateStaff, deleteStaff } = useStaff();
  const { settings, updateSettings } = useSettings();
  const { notifications, markAllRead, markRead, addNotification } = useNotifications();

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
  };
}

export type AppData = ReturnType<typeof useAppData>;
