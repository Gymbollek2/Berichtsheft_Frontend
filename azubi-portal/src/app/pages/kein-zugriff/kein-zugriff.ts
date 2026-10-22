import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Auth } from '@app/services/auth';
import { errorMessage } from '@app/core/utils';

/** Merkt sich das abgelehnte Windows-Konto für die Anzeige (auch nach Neuladen der Seite). */
export const KONTO_KEY = 'azubi-portal.sso-konto';

/**
 * Wird gezeigt, wenn die Windows-Anmeldung geklappt hat, das Konto aber nicht in der Personenliste steht.
 * Alle anderen Seiten bleiben gesperrt: Ohne Token leitet der Guard zur Anmeldung, die wieder hierher führt.
 */
@Component({
  selector: 'app-kein-zugriff',
  templateUrl: './kein-zugriff.html',
  styleUrl: '../login/login.css',
})
export class KeinZugriff {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly konto = signal(sessionStorage.getItem(KONTO_KEY) ?? '');
  private readonly optionen = toSignal(this.auth.optionen$);
  /** Der Server erlaubt zusätzlich die Anmeldung mit Benutzername und Passwort. */
  readonly passwortLogin = computed(() => this.optionen()?.passwortLogin ?? false);
  /** Erneuter Versuch läuft gerade. */
  readonly versucht = signal(false);
  /** Ergebnis des letzten erneuten Versuchs (noch immer kein Zugriff, Fehler …). */
  readonly ergebnis = signal('');

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  mitPasswortAnmelden(): void {
    sessionStorage.removeItem(KONTO_KEY);
    this.auth.passwortAnmeldungWaehlen();
    this.router.navigate(['/login']);
  }

  /** Startet die Windows-Anmeldung sofort neu – z. B. nachdem das Konto in die Personenliste eingetragen wurde. */
  erneutVersuchen(): void {
    this.versucht.set(true);
    this.ergebnis.set('');
    this.auth.ssoLogin().subscribe({
      next: () => {
        sessionStorage.removeItem(KONTO_KEY);
        this.router.navigate(['/dashboard']);
      },
      error: (err: unknown) => {
        this.versucht.set(false);
        if (err instanceof HttpErrorResponse && err.status === 403) {
          const konto = (err.error as { konto?: string } | null)?.konto ?? '';
          sessionStorage.setItem(KONTO_KEY, konto);
          this.konto.set(konto);
          const zeit = new Date().toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
          });
          this.ergebnis.set(
            `Erneut versucht um ${zeit} Uhr – dein Konto hat weiterhin keinen Zugriff.`,
          );
          return;
        }
        this.ergebnis.set(
          err instanceof HttpErrorResponse && err.status === 401
            ? 'Dein Windows-Konto konnte nicht ermittelt werden.'
            : errorMessage(err, 'Die Windows-Anmeldung ist fehlgeschlagen'),
        );
      },
    });
  }
}
