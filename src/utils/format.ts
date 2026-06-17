export function formatSum(value: number): string {
  return Math.round(value).toLocaleString('uz-UZ') + ' so\'m';
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('uz-UZ');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uz-UZ');
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('uz-UZ');
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}
