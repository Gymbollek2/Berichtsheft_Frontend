import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PersonService } from '@app/services/person.service';
import { BerichtsheftService } from '@app/services/berichtsheft.service';
import { Person, WochenberichtSummary } from '@app/core/models';
import { errorMessage, normalizeSearch } from '@app/core/utils';

/** Ausbilder: Azubi auswählen und dessen Wochenübersicht anzeigen. */
@Component({
  selector: 'app-berichtsheft-azubis',
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './berichtsheft-azubis.html',
})
export class BerichtsheftAzubis implements OnInit {
  private readonly personService = inject(PersonService);
  private readonly berichtsheftService = inject(BerichtsheftService);

  readonly azubis = signal<Person[]>([]);
  readonly selected = signal<Person | null>(null);
  readonly wochen = signal<WochenberichtSummary[]>([]);
  readonly error = signal('');
  readonly search = signal('');

  readonly gefiltert = computed(() => {
    const q = normalizeSearch(this.search());
    return this.azubis().filter((p) => !q || normalizeSearch(p.fullName + ' ' + p.username).includes(q));
  });

  ngOnInit(): void {
    this.personService.getAzubis().subscribe({
      next: (list) => this.azubis.set(list),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  select(person: Person): void {
    this.selected.set(person);
    this.wochen.set([]);
    this.berichtsheftService.getHistorie(person.id).subscribe({
      next: (w) => this.wochen.set(w),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }
}
