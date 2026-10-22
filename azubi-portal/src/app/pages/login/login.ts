import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '@app/services/auth';
import { AnmeldeOptionen } from '@app/core/models';
import { errorMessage } from '@app/core/utils';
import { KONTO_KEY } from '@app/pages/kein-zugriff/kein-zugriff';

/**
 * Anmeldung. Ist die Windows-Anmeldung (SSO) eingeschaltet, wird beim Öffnen automatisch mit dem
 * Windows-Konto angemeldet; wer nicht in der Personenliste steht, landet auf „Kein Zugriff“.
 */
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  user = '';
  password = '';
  readonly error = signal('');
  readonly loading = signal(false);
  readonly isPasswordVisible = signal(false);
  readonly optionen = signal<AnmeldeOptionen | null>(null);
  /** Windows-Anmeldung läuft gerade. */
  readonly ssoLaeuft = signal(false);
  /** Hinweis, warum die Windows-Anmeldung nicht geklappt hat. */
  readonly ssoHinweis = signal('');

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.auth.optionen$.subscribe((optionen) => {
      this.optionen.set(optionen);
      if (optionen.sso && !this.auth.wurdeAbgemeldet()) {
        this.windowsAnmeldung();
      }
    });
  }

  togglePassword(): void {
    this.isPasswordVisible.update((v) => !v);
  }

  windowsAnmeldung(): void {
    this.ssoLaeuft.set(true);
    this.ssoHinweis.set('');
    this.error.set('');
    this.auth.ssoLogin().subscribe({
      next: () => {
        sessionStorage.removeItem(KONTO_KEY);
        this.router.navigate(['/dashboard']);
      },
      error: (err: unknown) => {
        this.ssoLaeuft.set(false);
        if (err instanceof HttpErrorResponse && err.status === 403) {
          const konto = (err.error as { konto?: string } | null)?.konto;
          sessionStorage.setItem(KONTO_KEY, konto ?? '');
          this.router.navigate(['/kein-zugriff']);
          return;
        }
        this.ssoHinweis.set(
          err instanceof HttpErrorResponse && err.status === 401
            ? 'Dein Windows-Konto konnte nicht automatisch ermittelt werden. Bist du an einem Firmenrechner angemeldet?'
            : errorMessage(err, 'Die Windows-Anmeldung ist fehlgeschlagen'),
        );
      },
    });
  }

  login(): void {
    if (!this.user || !this.password) {
      this.error.set('Bitte Benutzername und Passwort eingeben');
      return;
    }
    this.error.set('');
    this.loading.set(true);

    this.auth.login(this.user.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err, 'Login fehlgeschlagen'));
      },
    });
  }
}
