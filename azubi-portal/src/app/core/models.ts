/** Datentypen der Backend-API (Berichtsheft-Backend /v1/...). */

export type Role = 'ROLE_TRAINEE' | 'ROLE_STUDENT' | 'ROLE_TRAINER';
export type Kind = 'KIND_GENERAL' | 'KIND_BROAD' | 'KIND_SPECIFIC';
export type LernzielStatus = 'STATUS_UNFINISHED' | 'STATUS_IN_PROGRESS' | 'STATUS_DONE';
export type EintragArt = 'BETRIEB' | 'SCHULE' | 'URLAUB' | 'KRANK' | 'FEIERTAG' | 'SONSTIGES';
export type BerichtStatus = 'ENTWURF' | 'EINGEREICHT' | 'ABGEZEICHNET' | 'ABGELEHNT';

/** Herr oder Frau – danach richten sich Rollen- und Berufsbezeichnungen (im Portal wird nicht gegendert). */
export type Anrede = 'HERR' | 'FRAU';

export const ANREDEN: [Anrede, string][] = [
  ['HERR', 'Herr'],
  ['FRAU', 'Frau'],
];

const ROLLEN: Record<Role, { herr: string; frau: string; mehrzahl: string }> = {
  ROLE_TRAINEE: { herr: 'Auszubildender', frau: 'Auszubildende', mehrzahl: 'Auszubildende' },
  ROLE_STUDENT: { herr: 'Dualer Student', frau: 'Duale Studentin', mehrzahl: 'Duale Studenten' },
  ROLE_TRAINER: { herr: 'Ausbilder', frau: 'Ausbilderin', mehrzahl: 'Ausbilder' },
};

/** Rollenbezeichnung passend zur Anrede, z. B. "Ausbilderin"; ohne Anrede die männliche Form. */
export function rollenLabel(role: Role, anrede?: Anrede | '' | null): string {
  return anrede === 'FRAU' ? ROLLEN[role].frau : ROLLEN[role].herr;
}

/** Mehrzahl für Filter und Überschriften, z. B. "Duale Studenten". */
export function rollenMehrzahl(role: Role): string {
  return ROLLEN[role].mehrzahl;
}

export const KIND_LABELS: Record<Kind, string> = {
  KIND_GENERAL: 'Richtlernziel',
  KIND_BROAD: 'Groblernziel',
  KIND_SPECIFIC: 'Feinlernziel',
};

export const STATUS_LABELS: Record<LernzielStatus, string> = {
  STATUS_UNFINISHED: 'Offen',
  STATUS_IN_PROGRESS: 'In Bearbeitung',
  STATUS_DONE: 'Erreicht',
};

export const ART_LABELS: Record<EintragArt, string> = {
  BETRIEB: 'Betrieb',
  SCHULE: 'Berufsschule',
  URLAUB: 'Urlaub',
  KRANK: 'Krank',
  FEIERTAG: 'Feiertag',
  SONSTIGES: 'Sonstiges',
};

export const BERICHT_STATUS_LABELS: Record<BerichtStatus, string> = {
  ENTWURF: 'Entwurf',
  EINGEREICHT: 'Eingereicht',
  ABGEZEICHNET: 'Abgenommen',
  ABGELEHNT: 'Zur Überarbeitung',
};

/** Hierarchie: Richtlernziel → keines, Groblernziel → Richtlernziel, Feinlernziel → Groblernziel. */
export const REQUIRED_PARENT_KIND: Record<Kind, Kind | null> = {
  KIND_GENERAL: null,
  KIND_BROAD: 'KIND_GENERAL',
  KIND_SPECIFIC: 'KIND_BROAD',
};

/** Art, die ein direktes Unterziel hat (Feinlernziele haben keine Unterziele). */
export const CHILD_KIND: Record<Kind, Kind | null> = {
  KIND_GENERAL: 'KIND_BROAD',
  KIND_BROAD: 'KIND_SPECIFIC',
  KIND_SPECIFIC: null,
};

/** Arten von Tagen, an denen gearbeitet bzw. gelernt wurde (Stunden + Beschreibung Pflicht). */
export const ANWESEND: EintragArt[] = ['BETRIEB', 'SCHULE', 'SONSTIGES'];
/** Tage ohne Lernziele (Urlaub, Krankheit, Feiertag). */
export const ABWESEND: EintragArt[] = ['URLAUB', 'KRANK', 'FEIERTAG'];
export const MAX_STUNDEN = 10;

/** Ausbilder dürfen alles (eine eigene Admin-Rolle gibt es nicht). */
export function isStaff(role: Role | undefined | null): boolean {
  return role === 'ROLE_TRAINER';
}

export function isLearner(role: Role | undefined | null): boolean {
  return role === 'ROLE_TRAINEE' || role === 'ROLE_STUDENT';
}

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  anrede: Anrede | null;
  fullName: string;
  role: Role;
  roleLabel: string;
  username: string;
  beruf: string | null;
  yearOfTraining: number;
  dateOfTrainingStart: string | null;
  dateOfBirth: string | null;
  lastLogin: string | null;
}

/** Eine Person im Ausbildungsorganigramm (nur öffentliche Angaben). */
export interface OrganigrammMitglied {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
  roleLabel: string;
  beruf: string | null;
}

/** GET /v1/person/organigramm: Ausbilder oben, darunter die Lernenden nach Ausbildungsjahr (höchstes zuerst). */
export interface Organigramm {
  ausbilder: OrganigrammMitglied[];
  jahrgaenge: { ausbildungsjahr: number; mitglieder: OrganigrammMitglied[] }[];
}

export interface PersonCreateRequest {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  anrede?: Anrede | null;
  role: Role;
  username?: string | null;
  password: string;
  beruf?: string | null;
  dateOfTrainingStart?: string | null;
  dateOfBirth?: string | null;
}

export interface PersonUpdateRequest {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  anrede?: Anrede | null;
  role: Role;
  username: string;
  beruf?: string | null;
  dateOfTrainingStart?: string | null;
  dateOfBirth?: string | null;
}

/** Anmeldearten, die der Server anbietet (GET /v1/passport/optionen). */
export interface AnmeldeOptionen {
  /** Windows-Anmeldung (Single Sign-on) ist eingeschaltet. */
  sso: boolean;
  /** Anmeldung mit Benutzername und Passwort ist erlaubt. */
  passwortLogin: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: Person;
}

export interface Lernziel {
  id: number;
  title: string;
  description: string | null;
  kind: Kind;
  kindLabel: string;
  parentId: number | null;
  anzahlUntergeordnet: number;
}

export interface LernzielRequest {
  title: string;
  description?: string | null;
  kind: Kind;
  parentId?: number | null;
}

export interface PersonLernziel {
  id: number;
  personId: number;
  lernziel: Lernziel;
  status: LernzielStatus;
  statusLabel: string;
  /** Status wird aus den Unterzielen berechnet und ist nicht direkt änderbar. */
  berechnet: boolean;
  updatedAt: string | null;
}

export interface Fortschritt {
  personId: number;
  personName: string;
  gesamt: number;
  offen: number;
  inBearbeitung: number;
  erreicht: number;
  prozent: number;
}

export interface BerichtsheftEintrag {
  id: number;
  date: string;
  hours: number;
  art: EintragArt;
  artLabel: string;
  description: string | null;
  lernziele: Lernziel[];
  /** Zeitpunkt der letzten Speicherung (ISO, Ortszeit des Servers); null bei alten Einträgen. */
  updatedAt: string | null;
}

export interface WochenTag {
  date: string;
  wochentag: string;
  eintrag: BerichtsheftEintrag | null;
}

export interface Wochenbericht {
  id: number | null;
  personId: number;
  personName: string;
  /** Rolle passend zur Anrede, z. B. "Auszubildende" (für die Unterschriftszeile im Ausdruck). */
  rolle: string;
  beruf: string | null;
  ausbildungsjahr: number;
  weekStart: string;
  weekEnd: string;
  kalenderwoche: number;
  jahr: number;
  status: BerichtStatus;
  statusLabel: string;
  editierbar: boolean;
  kommentar: string | null;
  geprueftVon: string | null;
  eingereichtAm: string | null;
  geprueftAm: string | null;
  gesamtStunden: number;
  /** false: Ausbilder öffnet eine noch nicht abgegebene Woche – die Einträge werden nicht mitgeliefert. */
  eintraegeSichtbar: boolean;
  tage: WochenTag[];
}

export interface WochenberichtSummary {
  id: number | null;
  personId: number;
  personName: string;
  weekStart: string;
  kalenderwoche: number;
  jahr: number;
  status: BerichtStatus;
  statusLabel: string;
  gesamtStunden: number;
  anzahlEintraege: number;
  eingereichtAm: string | null;
  geprueftAm: string | null;
}

export interface BerichtsheftSaveRequest {
  date: string;
  hours: number;
  art: EintragArt;
  description: string | null;
  lernzielIds: number[];
}

export interface CsvImportResult {
  importiert: number;
  fehler: string[];
}

export interface ApiError {
  status: number;
  message: string;
}

export type BenachrichtigungTyp =
  | 'BERICHT_ABGEGEBEN'
  | 'BERICHT_ABGEZEICHNET'
  | 'BERICHT_ZURUECKGEGEBEN'
  | 'BERICHT_WIEDER_GEOEFFNET'
  | 'ERINNERUNG_ABGABE'
  | 'LERNZIEL_ERREICHT'
  | 'WILLKOMMEN';

export interface Benachrichtigung {
  id: number;
  typ: BenachrichtigungTyp;
  titel: string;
  text: string | null;
  /** Ziel in der Anwendung, z. B. /berichtsheft?datum=2026-10-19 */
  link: string | null;
  erstelltAm: string;
  gelesen: boolean;
}

export interface Benachrichtigungen {
  ungelesen: number;
  eintraege: Benachrichtigung[];
}
