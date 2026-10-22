import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Auth } from '@app/services/auth';

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

  readonly konto = sessionStorage.getItem(KONTO_KEY) ?? '';
  private readonly optionen = toSignal(this.auth.optionen$);
  /** Der Server erlaubt zusätzlich die Anmeldung mit Benutzername und Passwort. */
  readonly passwortLogin = computed(() => this.optionen()?.passwortLogin ?? false);

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

  erneutVersuchen(): void {
    sessionStorage.removeItem(KONTO_KEY);
    this.router.navigate(['/login']);
  }
}
