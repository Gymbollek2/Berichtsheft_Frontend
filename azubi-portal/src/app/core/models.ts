/** Datentypen der Backend-API (Berichtsheft-Backend /v1/...). */

export type Role = 'ROLE_TRAINEE' | 'ROLE_STUDENT' | 'ROLE_TRAINER' | 'ROLE_ADMIN';
export type Kind = 'KIND_GENERAL' | 'KIND_BROAD' | 'KIND_SPECIFIC';
export type LernzielStatus = 'STATUS_UNFINISHED' | 'STATUS_IN_PROGRESS' | 'STATUS_DONE';
export type EintragArt = 'BETRIEB' | 'SCHULE' | 'URLAUB' | 'KRANK' | 'FEIERTAG' | 'SONSTIGES';
export type BerichtStatus = 'ENTWURF' | 'EINGEREICHT' | 'ABGEZEICHNET' | 'ABGELEHNT';

export const ROLE_LABELS: Record<Role, string> = {
  ROLE_TRAINEE: 'Auszubildende/r',
  ROLE_STUDENT: 'Duale/r Student/in',
  ROLE_TRAINER: 'Ausbilder/in',
  ROLE_ADMIN: 'Administrator/in',
};

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
  ABGEZEICHNET: 'Abgezeichnet',
  ABGELEHNT: 'Zur Überarbeitung',
};

export function isStaff(role: Role | undefined | null): boolean {
  return role === 'ROLE_TRAINER' || role === 'ROLE_ADMIN';
}

export function isLearner(role: Role | undefined | null): boolean {
  return role === 'ROLE_TRAINEE' || role === 'ROLE_STUDENT';
}

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
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

export interface PersonCreateRequest {
  firstName: string;
  lastName: string;
  role: Role;
  username?: string | null;
  password: string;
  beruf?: string | null;
  yearOfTraining: number;
  dateOfTrainingStart?: string | null;
  dateOfBirth?: string | null;
}

export interface PersonUpdateRequest {
  firstName: string;
  lastName: string;
  role: Role;
  username: string;
  beruf?: string | null;
  yearOfTraining: number;
  dateOfTrainingStart?: string | null;
  dateOfBirth?: string | null;
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
