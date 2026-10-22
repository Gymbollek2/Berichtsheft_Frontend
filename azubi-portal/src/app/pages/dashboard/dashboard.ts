import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '@app/services/auth';
import { BerichtsheftService } from '@app/services/berichtsheft.service';
import { PersonLernzielService } from '@app/services/person-lernziel.service';
import { Fortschritt, Wochenbericht, WochenberichtSummary } from '@app/core/models';
import { errorMessage, today } from '@app/core/utils';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  protected readonly auth = inject(Auth);
  private readonly berichtsheft = inject(BerichtsheftService);
  private readonly personLernziele = inject(PersonLernzielService);

  readonly error = signal('');

  // Azubi
  readonly fortschritt = signal<Fortschritt | null>(null);
  readonly aktuelleWoche = signal<Wochenbericht | null>(null);
  readonly historie = signal<WochenberichtSummary[]>([]);
  readonly abgelehnt = computed(() => this.historie().filter((w) => w.status === 'ABGELEHNT'));

  // Ausbilder
  readonly offen = signal<WochenberichtSummary[]>([]);
  readonly alleFortschritte = signal<Fortschritt[]>([]);

  readonly begruessung = computed(() => {
    const h = new Date().getHours();
    return h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
  });

  ngOnInit(): void {
    const onError = (err: unknown) => this.error.set(errorMessage(err));
    if (this.auth.isStaff()) {
      this.berichtsheft.getOffen().subscribe({ next: (v) => this.offen.set(v), error: onError });
      this.personLernziele.getProgressAll().subscribe({ next: (v) => this.alleFortschritte.set(v), error: onError });
    } else {
      this.personLernziele.getMyProgress().subscribe({ next: (v) => this.fortschritt.set(v), error: onError });
      this.berichtsheft.getWoche(today()).subscribe({ next: (v) => this.aktuelleWoche.set(v), error: onError });
      this.berichtsheft.getHistorie().subscribe({ next: (v) => this.historie.set(v), error: onError });
    }
  }

  erfassteTage(woche: Wochenbericht): number {
    return woche.tage.filter((t) => t.eintrag).length;
  }
}
