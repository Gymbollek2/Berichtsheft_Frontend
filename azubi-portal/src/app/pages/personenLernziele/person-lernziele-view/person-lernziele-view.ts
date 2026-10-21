import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@app/services/auth';
import { PersonService } from '@app/services/person.service';
import { PersonLernzielService } from '@app/services/person-lernziel.service';
import {
  Fortschritt,
  KIND_LABELS,
  LernzielStatus,
  Person,
  PersonLernziel,
  STATUS_LABELS,
} from '@app/core/models';
import { errorMessage, normalizeSearch, treeOrder } from '@app/core/utils';

/**
 * Lernfortschritt: Azubis sehen ihre eigenen Lernziele, Ausbilder wählen einen Azubi
 * und setzen den Status (Offen / In Bearbeitung / Erreicht).
 */
@Component({
  selector: 'app-person-lernziele-view',
  imports: [FormsModule, DatePipe],
  templateUrl: './person-lernziele-view.html',
})
export class PersonLernzieleView {
  protected readonly auth = inject(Auth);
  private readonly personService = inject(PersonService);
  private readonly service = inject(PersonLernzielService);
  private readonly router = inject(Router);

  /** Query-Parameter ?personId= (nur Ausbilder). */
  readonly personId = input<string | undefined>();

  readonly kindLabels = KIND_LABELS;
  readonly statusOptions = Object.entries(STATUS_LABELS) as [LernzielStatus, string][];

  readonly azubis = signal<Person[]>([]);
  readonly lernziele = signal<PersonLernziel[]>([]);
  readonly fortschritt = signal<Fortschritt | null>(null);
  readonly error = signal('');
  readonly loading = signal(false);
  readonly search = signal('');
  readonly statusFilter = signal<LernzielStatus | ''>('');

  readonly selectedId = computed(() => (this.personId() ? Number(this.personId()) : null));

  /** Ohne Filter als Baum (Richt → Grob → Fein), mit Filter als flache Trefferliste. */
  readonly gefiltert = computed<{ pl: PersonLernziel; depth: number }[]>(() => {
    const q = normalizeSearch(this.search());
    const status = this.statusFilter();
    if (!q && !status) {
      return treeOrder(this.lernziele(), (pl) => pl.lernziel.id, (pl) => pl.lernziel.parentId).map((r) => ({
        pl: r.item,
        depth: r.depth,
      }));
    }
    return this.lernziele()
      .filter(
        (pl) =>
          (!status || pl.status === status) &&
          (!q || normalizeSearch(pl.lernziel.title + ' ' + (pl.lernziel.description ?? '')).includes(q)),
      )
      .map((pl) => ({ pl, depth: 0 }));
  });

  constructor() {
    if (this.auth.isStaff()) {
      this.personService.getAzubis().subscribe({
        next: (list) => this.azubis.set(list),
        error: (err) => this.error.set(errorMessage(err)),
      });
    }

    effect(() => {
      const id = this.selectedId();
      untracked(() => this.load(id));
    });
  }

  selectPerson(id: string): void {
    this.router.navigate([], { queryParams: { personId: id || null } });
  }

  load(personId: number | null): void {
    this.lernziele.set([]);
    this.fortschritt.set(null);
    if (this.auth.isStaff() && !personId) {
      return;
    }
    this.loading.set(true);
    const list$ = personId ? this.service.getForPerson(personId) : this.service.getMine();
    list$.subscribe({
      next: (list) => {
        this.lernziele.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
    this.loadProgress(personId);
  }

  setStatus(pl: PersonLernziel, status: LernzielStatus): void {
    this.service.setStatus(pl.id, status).subscribe({
      next: () => {
        // Übergeordnete Ziele werden im Backend neu berechnet → Liste ohne Flackern neu laden
        const id = this.selectedId();
        const list$ = id ? this.service.getForPerson(id) : this.service.getMine();
        list$.subscribe((list) => this.lernziele.set(list));
        this.loadProgress(id);
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  private loadProgress(personId: number | null): void {
    const progress$ = personId ? this.service.getProgress(personId) : this.service.getMyProgress();
    progress$.subscribe({ next: (f) => this.fortschritt.set(f), error: () => {} });
  }
}
