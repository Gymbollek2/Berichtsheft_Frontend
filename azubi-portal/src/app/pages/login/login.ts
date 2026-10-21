import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '@app/services/auth';
import { errorMessage } from '@app/core/utils';

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

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePassword(): void {
    this.isPasswordVisible.update((v) => !v);
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
