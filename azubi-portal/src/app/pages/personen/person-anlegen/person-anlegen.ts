import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '@app/services/auth';
import { PersonService } from '@app/services/person.service';
import { Person, isLearner } from '@app/core/models';
import { errorMessage } from '@app/core/utils';
import { PersonForm, assignableRoles, emptyPersonForm, emptyToNull, generatePassword } from '../person-form';

@Component({
  selector: 'app-person-anlegen',
  imports: [FormsModule, RouterLink],
  templateUrl: './person-anlegen.html',
})
export class PersonAnlegen {
  private readonly auth = inject(Auth);
  private readonly service = inject(PersonService);

  readonly roles = assignableRoles(this.auth.isAdmin());
  readonly model = signal<PersonForm>(emptyPersonForm());
  readonly error = signal('');
  readonly saving = signal(false);
  readonly created = signal<{ person: Person; password: string } | null>(null);
  readonly lernend = computed(() => isLearner(this.model().role));

  set<K extends keyof PersonForm>(key: K, value: PersonForm[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  neuesPasswort(): void {
    this.set('password', generatePassword());
  }

  speichern(): void {
    const m = this.model();
    if (!m.firstName.trim() || !m.lastName.trim()) {
      this.error.set('Vor- und Nachname sind Pflichtfelder.');
      return;
    }
    if (m.password.length < 8) {
      this.error.set('Das Startpasswort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.service
      .create({
        firstName: m.firstName.trim(),
        lastName: m.lastName.trim(),
        role: m.role,
        username: emptyToNull(m.username),
        password: m.password,
        beruf: this.lernend() ? emptyToNull(m.beruf) : null,
        yearOfTraining: this.lernend() ? Number(m.yearOfTraining) || 0 : 0,
        dateOfTrainingStart: this.lernend() ? emptyToNull(m.dateOfTrainingStart) : null,
        dateOfBirth: emptyToNull(m.dateOfBirth),
      })
      .subscribe({
        next: (person) => {
          this.saving.set(false);
          this.created.set({ person, password: m.password });
          this.model.set(emptyPersonForm());
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(errorMessage(err));
        },
      });
  }
}
