import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@app/services/auth';
import { errorMessage } from '@app/core/utils';
import { PASSWORD_PATTERN } from '../personen/person-form';

/** Eigene Daten ansehen und Passwort ändern. */
@Component({
  selector: 'app-profil',
  imports: [FormsModule, DatePipe],
  templateUrl: './profil.html',
})
export class Profil {
  protected readonly auth = inject(Auth);

  readonly oldPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly error = signal('');
  readonly info = signal('');
  readonly saving = signal(false);

  constructor() {
    this.auth.refreshMe().subscribe({ error: () => {} });
  }

  passwortAendern(): void {
    this.error.set('');
    this.info.set('');
    if (!PASSWORD_PATTERN.test(this.newPassword())) {
      this.error.set('Das neue Passwort braucht mindestens 8 Zeichen mit Buchstaben und Ziffern.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Die beiden neuen Passwörter stimmen nicht überein.');
      return;
    }
    this.saving.set(true);
    this.auth.changePassword(this.oldPassword(), this.newPassword()).subscribe({
      next: () => {
        this.saving.set(false);
        this.oldPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.info.set('Passwort geändert.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
