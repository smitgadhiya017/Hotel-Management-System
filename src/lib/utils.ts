import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = 'INR'): string {
  const num = typeof amount === 'number' ? (isNaN(amount) ? 0 : amount) : (Number(amount) || 0);
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', INR: '₹', JPY: '¥' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy HH:mm');
  } catch {
    return dateStr;
  }
}

export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  return Math.max(0, nights);
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateBookingId(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  return `BK-${year}-${num}`;
}

export function generatePaymentId(): string {
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  return `PAY-${num}`;
}

export function generateEmployeeId(): string {
  const num = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
  return `EMP-${num}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700',
    'bg-rose-100 text-rose-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val == null ? '' : String(val);
        return str.includes(',') ? `"${str}"` : str;
      }).join(',')
    )
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    'Available': 'bg-green-50 text-green-700 border-green-200',
    'Occupied': 'bg-blue-50 text-blue-700 border-blue-200',
    'Reserved': 'bg-amber-50 text-amber-700 border-amber-200',
    'Maintenance': 'bg-red-50 text-red-700 border-red-200',
    'Confirmed': 'bg-blue-50 text-blue-700 border-blue-200',
    'Checked In': 'bg-green-50 text-green-700 border-green-200',
    'Checked Out': 'bg-slate-50 text-slate-600 border-slate-200',
    'Cancelled': 'bg-red-50 text-red-700 border-red-200',
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Paid': 'bg-green-50 text-green-700 border-green-200',
    'Partial': 'bg-amber-50 text-amber-700 border-amber-200',
    'Unpaid': 'bg-red-50 text-red-700 border-red-200',
    'Refunded': 'bg-purple-50 text-purple-700 border-purple-200',
    'Active': 'bg-green-50 text-green-700 border-green-200',
    'VIP': 'bg-purple-50 text-purple-700 border-purple-200',
    'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
    'Inactive': 'bg-slate-50 text-slate-600 border-slate-200',
    'Blacklisted': 'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] || 'bg-slate-50 text-slate-600 border-slate-200';
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
