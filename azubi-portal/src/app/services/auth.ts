import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';
import { AnmeldeOptionen, LoginResponse, Person, Role, isLearner, isStaff } from '@app/core/models';

const TOKEN_KEY = 'azubi-portal.token';
const USER_KEY = 'azubi-portal.user';
const EXPIRES_KEY = 'azubi-portal.expires';
/**
 * Warum in diesem Tab nicht automatisch per Windows angemeldet wird (gilt bis zum Schließen des Tabs):
 * nach „Abmelden“ oder wenn auf „Kein Zugriff“ die Anmeldung mit Benutzername und Passwort gewählt wurde.
 */
const OHNE_WINDOWS_KEY = 'azubi-portal.abgemeldet';
const ABGEMELDET = '1';
const PASSWORT_GEWAEHLT = 'passwort';

/** Anmeldung, Token-Verwaltung und Infos zum angemeldeten Benutzer. */
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = '/v1/passport';

  private readonly userSignal = signal<Person | null>(this.readUser());

  readonly user = this.userSignal.asReadonly();
  readonly role = computed<Role | null>(() => this.userSignal()?.role ?? null);
  readonly isStaff = computed(() => isStaff(this.role()));
  readonly isLearner = computed(() => isLearner(this.role()));

  /** Anmeldearten des Servers – einmal geladen und gemerkt. Ältere Server ohne Endpunkt: nur Passwort. */
  readonly optionen$: Observable<AnmeldeOptionen> = this.http
    .get<AnmeldeOptionen>(`${this.apiUrl}/optionen`)
    .pipe(
      catchError(() => of({ sso: false, passwortLogin: true })),
      shareReplay(1),
    );

  /** Anmeldung mit dem Windows-Konto. Der Browser schickt die Windows-Anmeldung selbst mit (Kerberos/NTLM). */
  ssoLogin(): Observable<LoginResponse> {
    return this.http
      .get<LoginResponse>(`${this.apiUrl}/sso`)
      .pipe(tap((response) => this.storeSession(response)));
  }

  /** true, wenn in diesem Tab nicht automatisch per Windows angemeldet werden soll. */
  ohneAutomatischeWindowsAnmeldung(): boolean {
    return sessionStorage.getItem(OHNE_WINDOWS_KEY) !== null;
  }

  /** true, wenn der Benutzer auf „Kein Zugriff“ die Anmeldung mit Benutzername und Passwort gewählt hat. */
  passwortAnmeldungGewaehlt(): boolean {
    return sessionStorage.getItem(OHNE_WINDOWS_KEY) === PASSWORT_GEWAEHLT;
  }

  /** Wechsel von „Kein Zugriff“ zur Anmeldung mit Benutzername und Passwort – ohne erneute Windows-Anmeldung. */
  passwortAnmeldungWaehlen(): void {
    sessionStorage.setItem(OHNE_WINDOWS_KEY, PASSWORT_GEWAEHLT);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(tap((response) => this.storeSession(response)));
  }

  changePassword(oldPassword: string, newPassword: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/change-password`, { oldPassword, newPassword })
      .pipe(tap((response) => this.storeSession(response)));
  }

  /** Lädt die eigenen Daten neu (z. B. nach Änderungen durch einen Ausbilder). */
  refreshMe(): Observable<Person> {
    return this.http.get<Person>(`${this.apiUrl}/me`).pipe(
      tap((person) => {
        localStorage.setItem(USER_KEY, JSON.stringify(person));
        this.userSignal.set(person);
      }),
    );
  }

  /** @param selbst vom Benutzer ausgelöst – dann keine automatische Windows-Anmeldung direkt danach */
  logout(redirect = true, selbst = false): void {
    if (selbst) {
      sessionStorage.setItem(OHNE_WINDOWS_KEY, ABGEMELDET);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    this.userSignal.set(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const expires = localStorage.getItem(EXPIRES_KEY);
    if (!token || !this.userSignal()) {
      return false;
    }
    if (expires && new Date(expires).getTime() <= Date.now()) {
      this.logout(false);
      return false;
    }
    return true;
  }

  hasAnyRole(roles: Role[]): boolean {
    const role = this.role();
    return !!role && roles.includes(role);
  }

  private storeSession(response: LoginResponse): void {
    sessionStorage.removeItem(OHNE_WINDOWS_KEY);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(EXPIRES_KEY, response.expiresAt);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.userSignal.set(response.user);
  }

  private readUser(): Person | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as Person) : null;
    } catch {
      return null;
    }
  }
}
