import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '@app/services/auth';
import { PersonService } from '@app/services/person.service';
import { Organigramm as OrganigrammDaten, OrganigrammMitglied } from '@app/core/models';
import { errorMessage } from '@app/core/utils';

/**
 * Ausbildungsorganigramm für alle: oben die Ausbilder, darunter die Azubis und dualen Studenten nach Ausbildungsjahr
 * (höchstes zuerst). Das Jahr berechnet der Server bei jedem Abruf aus dem Ausbildungsbeginn – wer ins nächste
 * Jahr wechselt, rückt automatisch auf; wer erst noch anfängt, erscheint ab dem Ausbildungsbeginn.
 */
@Component({
  selector: 'app-organigramm',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './organigramm.html',
  styleUrl: './organigramm.css',
})
export class Organigramm implements OnInit {
  private readonly auth = inject(Auth);
  private readonly service = inject(PersonService);

  readonly daten = signal<OrganigrammDaten | null>(null);
  readonly error = signal('');

  /** Ausbilder dürfen von einer Karte direkt ins Berichtsheft der Person springen. */
  readonly istAusbilder = computed(() => this.auth.role() === 'ROLE_TRAINER');
  readonly anzahlLernende = computed(
    () => this.daten()?.jahrgaenge.reduce((summe, j) => summe + j.mitglieder.length, 0) ?? 0,
  );

  ngOnInit(): void {
    this.service.getOrganigramm().subscribe({
      next: (d) => this.daten.set(d),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  istIch(m: OrganigrammMitglied): boolean {
    return this.auth.user()?.id === m.id;
  }

  initialen(m: OrganigrammMitglied): string {
    return (m.firstName.charAt(0) + m.lastName.charAt(0)).toUpperCase();
  }

  anzahl(n: number): string {
    return n === 1 ? '1 Person' : `${n} Personen`;
  }
}
