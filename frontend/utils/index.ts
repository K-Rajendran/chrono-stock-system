import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getDiscountPercent(sellingPrice: number, effectivePrice: number): number {
  if (!sellingPrice || sellingPrice === effectivePrice) return 0;
  return Math.round(((sellingPrice - effectivePrice) / sellingPrice) * 100);
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

export function stockStatusLabel(status: string): string {
  switch (status) {
    case 'IN_STOCK': return 'In Stock';
    case 'LOW_STOCK': return 'Low Stock';
    case 'OUT_OF_STOCK': return 'Out of Stock';
    default: return status;
  }
}

export function paymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pending', PAID: 'Paid', PARTIAL: 'Partial', CANCELLED: 'Cancelled',
  };
  return map[status] ?? status;
}

export function billStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Draft', ISSUED: 'Issued', SENT: 'Sent', PAID: 'Paid', CANCELLED: 'Cancelled',
  };
  return map[status] ?? status;
}

export function prStatusLabel(status: string): string {
  const map: Record<string, string> = {
    REQUESTED: 'Requested', UNDER_REVIEW: 'Under Review',
    BILL_GENERATED: 'Bill Generated', SENT: 'Sent',
    PAID: 'Paid', PENDING: 'Pending', CANCELLED: 'Cancelled', COMPLETED: 'Completed',
  };
  return map[status] ?? status;
}

export function prStatusColor(status: string): string {
  switch (status) {
    case 'REQUESTED': return 'text-yellow-400 bg-yellow-400/10';
    case 'UNDER_REVIEW': return 'text-blue-400 bg-blue-400/10';
    case 'BILL_GENERATED': return 'text-brand-gold bg-brand-gold/10';
    case 'SENT': return 'text-purple-400 bg-purple-400/10';
    case 'PAID': case 'COMPLETED': return 'text-green-400 bg-green-400/10';
    case 'CANCELLED': return 'text-red-400 bg-red-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
}

export function paymentStatusColor(status: string): string {
  switch (status) {
    case 'PAID': return 'text-green-400 bg-green-400/10';
    case 'PENDING': return 'text-yellow-400 bg-yellow-400/10';
    case 'PARTIAL': return 'text-orange-400 bg-orange-400/10';
    case 'CANCELLED': return 'text-red-400 bg-red-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
}

export function billStatusColor(status: string): string {
  switch (status) {
    case 'ISSUED': return 'text-blue-400 bg-blue-400/10';
    case 'SENT': return 'text-purple-400 bg-purple-400/10';
    case 'PAID': return 'text-green-400 bg-green-400/10';
    case 'CANCELLED': return 'text-red-400 bg-red-400/10';
    case 'DRAFT': return 'text-gray-400 bg-gray-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
}
