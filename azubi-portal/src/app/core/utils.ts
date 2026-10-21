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
      return 'Backend nicht erreichbar – läuft der Server unter https://localhost:8443?';
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

/** Baut aus einer flachen Liste mit parentId eine Baum-Reihenfolge (Eltern vor Kindern) mit Tiefe. */
export function treeOrder<T>(items: T[], id: (t: T) => number, parentId: (t: T) => number | null): { item: T; depth: number }[] {
  const ids = new Set(items.map(id));
  const children = new Map<number | null, T[]>();
  for (const item of items) {
    const p = parentId(item);
    const key = p !== null && ids.has(p) ? p : null;
    children.set(key, [...(children.get(key) ?? []), item]);
  }
  const result: { item: T; depth: number }[] = [];
  const visit = (parent: number | null, depth: number) => {
    for (const item of children.get(parent) ?? []) {
      result.push({ item, depth });
      visit(id(item), depth + 1);
    }
  };
  visit(null, 0);
  return result;
}
