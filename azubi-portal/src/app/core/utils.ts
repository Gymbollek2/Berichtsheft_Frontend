import { HttpErrorResponse } from '@angular/common/http';
import type { Kind } from './models';

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

/** Zeitpunkt relativ zu jetzt, wie man es aus Benachrichtigungen kennt: „vor 5 Min.“, „gestern, 14:05“ … */
export function zeitRelativ(iso: string, jetzt: Date = new Date()): string {
  const zeit = new Date(iso);
  const minuten = Math.floor((jetzt.getTime() - zeit.getTime()) / 60000);
  const uhrzeit = `${String(zeit.getHours()).padStart(2, '0')}:${String(zeit.getMinutes()).padStart(2, '0')}`;
  if (minuten < 1) {
    return 'gerade eben';
  }
  if (minuten < 60) {
    return `vor ${minuten} Min.`;
  }
  if (toIsoDate(zeit) === toIsoDate(jetzt)) {
    return `vor ${Math.floor(minuten / 60)} Std.`;
  }
  const gestern = new Date(jetzt);
  gestern.setDate(gestern.getDate() - 1);
  if (toIsoDate(zeit) === toIsoDate(gestern)) {
    return `gestern, ${uhrzeit}`;
  }
  const datum = `${String(zeit.getDate()).padStart(2, '0')}.${String(zeit.getMonth() + 1).padStart(2, '0')}.`;
  return zeit.getFullYear() === jetzt.getFullYear()
    ? `${datum}, ${uhrzeit}`
    : `${datum}${zeit.getFullYear()}`;
}

/** Lesbare Fehlermeldung aus einer HTTP-Fehlerantwort des Backends. */
export function errorMessage(err: unknown, fallback = 'Es ist ein Fehler aufgetreten'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Backend nicht erreichbar – läuft der Server unter https://localhost:5016?';
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
export function treeOrder<T>(
  items: T[],
  id: (t: T) => number,
  parentId: (t: T) => number | null,
): { item: T; depth: number }[] {
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

/** Eine sichtbare Zeile im ein-/ausklappbaren Lernziel-Baum. */
export interface BaumZeile<T> {
  item: T;
  depth: number;
  /** Hat Unterziele (dann gibt es einen Pfeil zum Auf-/Zuklappen). */
  hatKinder: boolean;
  /** Unterziele sind gerade eingeklappt. */
  eingeklappt: boolean;
}

/**
 * Blendet die Unterziele eingeklappter Knoten aus.
 * Erwartet die Reihenfolge aus {@link treeOrder} (Eltern direkt vor ihren Kindern).
 */
export function sichtbarerBaum<T>(
  geordnet: { item: T; depth: number }[],
  id: (t: T) => number,
  eingeklappt: ReadonlySet<number>,
): BaumZeile<T>[] {
  const result: BaumZeile<T>[] = [];
  let versteckeTieferAls = Number.POSITIVE_INFINITY;
  geordnet.forEach((row, i) => {
    if (row.depth > versteckeTieferAls) {
      return;
    }
    versteckeTieferAls = Number.POSITIVE_INFINITY;
    const hatKinder = (geordnet[i + 1]?.depth ?? -1) > row.depth;
    const zu = hatKinder && eingeklappt.has(id(row.item));
    result.push({ ...row, hatKinder, eingeklappt: zu });
    if (zu) {
      versteckeTieferAls = row.depth;
    }
  });
  return result;
}

/** Bis zu welcher Ebene der Lernziel-Baum aufgeklappt ist. */
export type BaumEbene = 'richt' | 'grob' | 'alle';

export const BAUM_EBENEN: { wert: BaumEbene; label: string }[] = [
  { wert: 'richt', label: 'Nur Richtlernziele' },
  { wert: 'grob', label: 'Richt- und Groblernziele' },
  { wert: 'alle', label: 'Alle Ebenen' },
];

/**
 * Ids der Lernziele, die für eine Ebene eingeklappt werden:
 * „richt“ klappt alle Richtlernziele zu, „grob“ alle Groblernziele, „alle“ nichts.
 */
export function einklappenFuerEbene<T>(
  items: T[],
  id: (t: T) => number,
  kind: (t: T) => Kind,
  ebene: BaumEbene,
): Set<number> {
  const zu: Kind | null =
    ebene === 'richt' ? 'KIND_GENERAL' : ebene === 'grob' ? 'KIND_BROAD' : null;
  return new Set(zu ? items.filter((t) => kind(t) === zu).map(id) : []);
}

/** Merkt sich die gewählte Ebene pro Seite im Browser (nur Komfort – Fehler werden ignoriert). */
export function ladeBaumEbene(schluessel: string, fallback: BaumEbene = 'alle'): BaumEbene {
  try {
    const wert = localStorage.getItem(schluessel);
    return wert === 'richt' || wert === 'grob' || wert === 'alle' ? wert : fallback;
  } catch {
    return fallback;
  }
}

export function speichereBaumEbene(schluessel: string, ebene: BaumEbene): void {
  try {
    localStorage.setItem(schluessel, ebene);
  } catch {
    // z. B. privater Modus – dann eben ohne Merken
  }
}
