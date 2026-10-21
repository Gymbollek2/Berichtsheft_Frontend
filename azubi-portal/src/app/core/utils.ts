import { HttpErrorResponse } from '@angular/common/http';

/** Datum als YYYY-MM-DD in lokaler Zeit (ohne UTC-Verschiebung von toISOString). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function today(): string {
  return toIsoDate(new Date());
}

/** Lesbare Fehlermeldung aus einer HTTP-Fehlerantwort des Backends. */
export function errorMessage(err: unknown, fallback = 'Es ist ein Fehler aufgetreten'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Backend nicht erreichbar – läuft der Server auf Port 8080?';
    }
    const body = err.error as { message?: string } | null;
    if (body && typeof body === 'object' && body.message) {
      return body.message;
    }
    return `${fallback} (HTTP ${err.status})`;
  }
  return fallback;
}

/** Normalisiert Text für eine unscharfe Suche (Kleinbuchstaben, ohne Umlaute). */
export function normalizeSearch(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}
