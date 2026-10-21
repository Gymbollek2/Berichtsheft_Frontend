import { Role, ROLE_LABELS } from '@app/core/models';

/** Formularmodell für Personen (anlegen & bearbeiten). */
export interface PersonForm {
  firstName: string;
  lastName: string;
  role: Role;
  username: string;
  password: string;
  beruf: string;
  yearOfTraining: number;
  dateOfTrainingStart: string;
  dateOfBirth: string;
}

export function emptyPersonForm(): PersonForm {
  return {
    firstName: '',
    lastName: '',
    role: 'ROLE_TRAINEE',
    username: '',
    password: generatePassword(),
    beruf: 'Fachinformatiker/in Anwendungsentwicklung',
    yearOfTraining: 1,
    dateOfTrainingStart: '',
    dateOfBirth: '',
  };
}

/** Rollen, die der angemeldete Benutzer vergeben darf (Ausbilder: nur Azubis/Studierende). */
export function assignableRoles(isAdmin: boolean): [Role, string][] {
  const roles: Role[] = isAdmin
    ? ['ROLE_TRAINEE', 'ROLE_STUDENT', 'ROLE_TRAINER', 'ROLE_ADMIN']
    : ['ROLE_TRAINEE', 'ROLE_STUDENT'];
  return roles.map((r) => [r, ROLE_LABELS[r]]);
}

/** Zufälliges Startpasswort (ohne leicht verwechselbare Zeichen). */
export function generatePassword(length = 10): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

export function emptyToNull(value: string | null | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}
