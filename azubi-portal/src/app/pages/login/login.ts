import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '@app/services/auth';
import { AnmeldeOptionen } from '@app/core/models';
import { errorMessage } from '@app/core/utils';
import { KONTO_KEY } from '@app/pages/kein-zugriff/kein-zugriff';

/**
 * Anmeldung. Ist die Windows-Anmeldung (SSO) eingeschaltet, gibt es den Button „Mit Windows-Konto anmelden“.
 * Hat sie in diesem Browser schon einmal geklappt, startet sie beim Öffnen automatisch – sonst könnte der Browser
 * (z. B. im Inkognito-Fenster) sein eigenes Anmeldefenster zeigen. Wer nicht in der Personenliste steht,
 * landet auf „Kein Zugriff“.
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
  private readonly route = inject(ActivatedRoute);

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
  /** Auf „Kein Zugriff“ wurde die Anmeldung mit Benutzername und Passwort gewählt – sie steht dann im Vordergrund. */
  readonly passwortGewaehlt = signal(this.auth.passwortAnmeldungGewaehlt());
  readonly selbstAbgemeldet = this.auth.selbstAbgemeldet();

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.weiter();
      return;
    }
    this.auth.optionen$.subscribe((optionen) => {
      this.optionen.set(optionen);
      if (
        optionen.sso &&
        this.auth.windowsAnmeldungBekannt() &&
        !this.auth.ohneAutomatischeWindowsAnmeldung()
      ) {
        this.windowsAnmeldung();
      }
    });
  }

  /**
   * Nach der Anmeldung zur ursprünglich aufgerufenen Seite (z. B. Button aus einer E-Mail), sonst zur Übersicht.
   * Nur Pfade innerhalb des Portals – kein Weiterleiten auf fremde Adressen.
   */
  private weiter(): void {
    const ziel = this.route.snapshot.queryParamMap.get('ziel');
    const erlaubt = !!ziel && ziel.startsWith('/') && !ziel.startsWith('//') && !ziel.startsWith('/login');
    this.router.navigateByUrl(erlaubt ? ziel : '/dashboard');
  }

  togglePassword(): void {
    this.isPasswordVisible.update((v) => !v);
  }

  windowsAnmeldung(): void {
    this.passwortGewaehlt.set(false);
    this.ssoLaeuft.set(true);
    this.ssoHinweis.set('');
    this.error.set('');
    this.auth.ssoLogin().subscribe({
      next: () => {
        sessionStorage.removeItem(KONTO_KEY);
        this.weiter();
      },
      error: (err: unknown) => {
        this.ssoLaeuft.set(false);
        if (err instanceof HttpErrorResponse && err.status === 403) {
          const konto = (err.error as { konto?: string } | null)?.konto;
          sessionStorage.setItem(KONTO_KEY, konto ?? '');
          this.router.navigate(['/kein-zugriff']);
          return;
        }
        // Kein Windows-Konto ermittelbar: beim nächsten Öffnen nicht wieder automatisch versuchen
        this.auth.windowsAnmeldungVergessen();
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
        this.weiter();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err, 'Login fehlgeschlagen'));
      },
    });
  }
}
