import { Anrede, Role, rollenLabel } from '@app/core/models';
import { today } from '@app/core/utils';

/** Formularmodell für Personen (anlegen & bearbeiten). */
export interface PersonForm {
  /** Leer, bis Herr oder Frau gewählt ist (Pflichtfeld). */
  anrede: Anrede | '';
  firstName: string;
  middleName: string;
  lastName: string;
  role: Role;
  username: string;
  password: string;
  beruf: string;
  dateOfTrainingStart: string;
  dateOfBirth: string;
}

export const PASSWORD_PATTERN = /^(?=.*[A-Za-zÄÖÜäöüß])(?=.*\d).{8,100}$/;
export const PASSWORD_HINT = 'Mindestens 8 Zeichen mit Buchstaben und Ziffern.';
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,50}$/;
export const USERNAME_HINT =
  'Kleinbuchstaben, Ziffern, Punkt, - und _ (3 bis 50 Zeichen). Bei Windows-Anmeldung den Windows-Anmeldenamen (sAMAccountName) eintragen.';

export function emptyPersonForm(): PersonForm {
  return {
    anrede: '',
    firstName: '',
    middleName: '',
    lastName: '',
    role: 'ROLE_TRAINEE',
    username: '',
    password: generatePassword(),
    beruf: 'Fachinformatiker Anwendungsentwicklung',
    dateOfTrainingStart: '',
    dateOfBirth: '',
  };
}

/** Rollen, die vergeben werden können – Ausbilder dürfen alle Rollen verwalten. Bezeichnung passend zur Anrede. */
export function assignableRoles(anrede: Anrede | '' = ''): [Role, string][] {
  const roles: Role[] = ['ROLE_TRAINEE', 'ROLE_STUDENT', 'ROLE_TRAINER'];
  return roles.map((r) => [r, rollenLabel(r, anrede)]);
}

/** Zufälliges Startpasswort mit Buchstaben und Ziffern (ohne verwechselbare Zeichen). */
export function generatePassword(length = 10): string {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = letters + digits;
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  const chars = Array.from(values, (v) => all[v % all.length]);
  chars[0] = letters[values[0] % letters.length];
  chars[length - 1] = digits[values[length - 1] % digits.length];
  return chars.join('');
}

/** Ausbildungsjahr aus dem Ausbildungsbeginn (wie im Backend): vor Beginn und im ersten Jahr = 1. */
export function ausbildungsjahr(start: string): number | null {
  if (!start) {
    return null;
  }
  const now = today();
  if (now < start) {
    return 1;
  }
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ny, nm, nd] = now.split('-').map(Number);
  let years = ny - sy;
  if (nm < sm || (nm === sm && nd < sd)) {
    years--;
  }
  return years + 1;
}

/** Prüft die Formularregeln, die auch das Backend durchsetzt. Gibt eine Fehlermeldung oder null zurück. */
export function validatePersonForm(m: PersonForm, learner: boolean, checkPassword: boolean): string | null {
  if (!m.anrede) {
    return 'Bitte wähle die Anrede (Herr oder Frau).';
  }
  if (!m.firstName.trim() || !m.lastName.trim()) {
    return 'Vor- und Nachname sind Pflichtfelder.';
  }
  if (m.username && !USERNAME_PATTERN.test(m.username)) {
    return 'Benutzername: ' + USERNAME_HINT;
  }
  if (checkPassword && !PASSWORD_PATTERN.test(m.password)) {
    return 'Startpasswort: ' + PASSWORD_HINT;
  }
  if (learner && !m.dateOfTrainingStart) {
    return 'Bitte gib den Ausbildungsbeginn an.';
  }
  if (learner && m.dateOfBirth && m.dateOfTrainingStart && m.dateOfBirth >= m.dateOfTrainingStart) {
    return 'Das Geburtsdatum muss vor dem Ausbildungsbeginn liegen.';
  }
  if (m.dateOfBirth && m.dateOfBirth >= today()) {
    return 'Das Geburtsdatum muss in der Vergangenheit liegen.';
  }
  return null;
}

/** Studiengänge, aus denen beim Anlegen eines Dualen Studenten gewählt wird. */
export function studiengaenge(anrede: Anrede | ''): string[] {
  return ['Informatiker', 'Wirtschaftsinformatiker'].map((s) => (anrede === 'FRAU' ? s + 'in' : s));
}

/**
 * Berufsbezeichnung passend zur Anrede: Das erste Wort wird zur weiblichen bzw. männlichen Form
 * ("Fachinformatiker Anwendungsentwicklung" ↔ "Fachinformatikerin Anwendungsentwicklung", "Informatiker" ↔
 * "Informatikerin"). Andere Bezeichnungen bleiben, wie sie sind.
 */
export function berufFuer(beruf: string, anrede: Anrede | ''): string {
  return beruf.replace(/^(\S*?er)(in)?(?=\s|$)/, (_, stamm: string) => (anrede === 'FRAU' ? stamm + 'in' : stamm));
}

/** Hinweis unter dem Zweitnamen: so wird die Adresse fuer E-Mail-Benachrichtigungen gebildet. */
export const MIDDLE_NAME_HINT = 'E-Mails gehen dann an Vorname-Zweitname.Nachname.';

export function emptyToNull(value: string | null | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}
