// Core Types for Hotel Management System

export type RoomType = 'Standard' | 'Deluxe' | 'Suite' | 'Family';
export type RoomStatus = 'Available' | 'Occupied' | 'Reserved' | 'Maintenance';
export type BookingStatus = 'Confirmed' | 'Checked In' | 'Checked Out' | 'Cancelled' | 'Pending';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Refunded';
export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'UPI';
export type StaffRole = 'Administrator' | 'Manager' | 'Receptionist' | 'Housekeeping' | 'Maintenance';
export type StaffStatus = 'Active' | 'On Leave' | 'Inactive';
export type GuestStatus = 'Active' | 'VIP' | 'Blacklisted';

export interface Room {
  id: string;
  roomNumber: string;
  type: RoomType;
  floor: number;
  capacity: number;
  pricePerNight: number;
  status: RoomStatus;
  amenities: string[];
  description: string;
  image?: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  notes: string;
  status: GuestStatus;
  totalBookings: number;
  totalSpent: number;
  createdAt: string;
}

export interface Reservation {
  id: string;
  bookingId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  pricePerNight: number;
  nights: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentId: string;
  bookingId: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  date: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  notes: string;
}

export interface StaffMember {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  email: string;
  phone: string;
  joiningDate: string;
  status: StaffStatus;
  department: string;
  avatar?: string;
}

export interface HotelSettings {
  name: string;
  address: string;
  email: string;
  phone: string;
  currency: string;
  checkInTime: string;
  checkOutTime: string;
  taxPercentage: number;
  invoiceFooter: string;
  notifications: {
    newReservation: boolean;
    checkIn: boolean;
    checkOut: boolean;
    payment: boolean;
  };
  appearance: {
    theme: 'light' | 'dark';
    sidebarCollapsed: boolean;
  };
  /*
  googleSheets?: {
    enabled: boolean;
    webAppUrl: string;
    spreadsheetId?: string;
    autoSync: boolean;
    lastSyncedAt?: string;
  };
  */
  // Supabase Database Integration Configuration
  supabase?: {
    enabled: boolean;
    url: string;
    anonKey?: string;
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    autoSync: boolean;
    lastSyncedAt?: string;
  };
}

export interface Notification {
  id: string;
  type: 'reservation' | 'checkin' | 'checkout' | 'payment';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface DashboardMetrics {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  reservedRooms: number;
  maintenanceRooms: number;
  todayRevenue: number;
  totalGuests: number;
  totalReservations: number;
}
