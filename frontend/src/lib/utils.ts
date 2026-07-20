import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a');
}

export function getScoreBandColor(band: string) {
  switch (band.toUpperCase()) {
    case 'A': return 'bg-green-100 text-green-700';
    case 'B': return 'bg-blue-100 text-blue-700';
    case 'C': return 'bg-amber-100 text-amber-700';
    case 'D': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
