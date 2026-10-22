import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '@app/services/auth';
import { PersonService } from '@app/services/person.service';
import { BestaetigungService } from '@app/shared/bestaetigung/bestaetigung.service';
import { Person, ROLE_LABELS, Role, isLearner } from '@app/core/models';
import { errorMessage, normalizeSearch } from '@app/core/utils';
import {
  PASSWORD_HINT,
  PASSWORD_PATTERN,
  PersonForm,
  USERNAME_HINT,
  assignableRoles,
  ausbildungsjahr,
  emptyToNull,
  generatePassword,
  validatePersonForm,
} from '../person-form';

/** Personenliste mit Suche, Bearbeiten, Passwort zurücksetzen und Löschen. */
@Component({
  selector: 'app-person-bearbeiten',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './person-bearbeiten.html',
})
export class PersonBearbeiten implements OnInit {
  protected readonly auth = inject(Auth);
  private readonly service = inject(PersonService);
  private readonly bestaetigung = inject(BestaetigungService);

  readonly roleLabels = ROLE_LABELS;
  readonly roleFilterOptions = Object.entries(ROLE_LABELS) as [Role, string][];
  readonly roles = assignableRoles();
  readonly passwordHint = PASSWORD_HINT;
  readonly usernameHint = USERNAME_HINT;

  readonly personen = signal<Person[]>([]);
  readonly search = signal('');
  readonly roleFilter = signal<Role | ''>('');
  readonly error = signal('');
  readonly info = signal('');

  readonly editing = signal<Person | null>(null);
  readonly model = signal<PersonForm | null>(null);
  readonly modalError = signal('');
  readonly saving = signal(false);

  readonly resetFor = signal<Person | null>(null);
  readonly resetPassword = signal('');

  readonly gefiltert = computed(() => {
    const q = normalizeSearch(this.search());
    const role = this.roleFilter();
    return this.personen().filter(
      (p) =>
        (!role || p.role === role) &&
        (!q || normalizeSearch(`${p.fullName} ${p.username} ${p.beruf ?? ''}`).includes(q)),
    );
  });
  readonly lernend = computed(() => isLearner(this.model()?.role));
  readonly jahr = computed(() => ausbildungsjahr(this.model()?.dateOfTrainingStart ?? ''));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe({
      next: (list) => this.personen.set(list),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  istIch(p: Person): boolean {
    return this.auth.user()?.id === p.id;
  }

  // ------------------------------------------------ Bearbeiten

  bearbeiten(p: Person): void {
    this.modalError.set('');
    this.editing.set(p);
    this.model.set({
      firstName: p.firstName,
      lastName: p.lastName,
      role: p.role,
      username: p.username,
      password: '',
      beruf: p.beruf ?? '',
      dateOfTrainingStart: p.dateOfTrainingStart ?? '',
      dateOfBirth: p.dateOfBirth ?? '',
    });
  }

  set<K extends keyof PersonForm>(key: K, value: PersonForm[K]): void {
    this.model.update((m) => (m ? { ...m, [key]: value } : m));
  }

  speichern(): void {
    const p = this.editing();
    const m = this.model();
    if (!p || !m) {
      return;
    }
    const username = m.username.trim().toLowerCase();
    const fehler = validatePersonForm({ ...m, username }, this.lernend(), false) ?? (username ? null : 'Bitte gib einen Benutzernamen an.');
    if (fehler) {
      this.modalError.set(fehler);
      return;
    }
    this.saving.set(true);
    this.modalError.set('');
    this.service
      .update(p.id, {
        firstName: m.firstName.trim(),
        lastName: m.lastName.trim(),
        role: m.role,
        username,
        beruf: this.lernend() ? emptyToNull(m.beruf) : null,
        dateOfTrainingStart: this.lernend() ? emptyToNull(m.dateOfTrainingStart) : null,
        dateOfBirth: emptyToNull(m.dateOfBirth),
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.personen.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
          this.schliessen();
          this.flash(`${updated.fullName} gespeichert`);
        },
        error: (err) => {
          this.saving.set(false);
          this.modalError.set(errorMessage(err));
        },
      });
  }

  schliessen(): void {
    this.editing.set(null);
    this.model.set(null);
  }

  // ------------------------------------------------ Passwort

  passwortZuruecksetzen(p: Person): void {
    this.modalError.set('');
    this.resetPassword.set(generatePassword());
    this.resetFor.set(p);
  }

  passwortSpeichern(): void {
    const p = this.resetFor();
    if (!p) {
      return;
    }
    if (!PASSWORD_PATTERN.test(this.resetPassword())) {
      this.modalError.set(PASSWORD_HINT);
      return;
    }
    this.service.resetPassword(p.id, this.resetPassword()).subscribe({
      next: () => {
        this.flash(`Neues Passwort für ${p.fullName}: ${this.resetPassword()}`, 10000);
        this.resetFor.set(null);
      },
      error: (err) => this.modalError.set(errorMessage(err)),
    });
  }

  // ------------------------------------------------ Löschen

  async loeschen(p: Person): Promise<void> {
    const ok = await this.bestaetigung.frage({
      titel: 'Person löschen?',
      text: `${p.fullName} wird gelöscht – mit Zugang, Berichtsheft und Lernfortschritt.`,
      bestaetigen: 'Löschen',
      icon: 'fa-user-xmark',
      ton: 'gefahr',
    });
    if (!ok) {
      return;
    }
    this.service.delete(p.id).subscribe({
      next: () => {
        this.personen.update((list) => list.filter((x) => x.id !== p.id));
        this.flash(`${p.fullName} gelöscht`);
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  private flash(message: string, ms = 3000): void {
    this.info.set(message);
    setTimeout(() => this.info.set(''), ms);
  }
}
