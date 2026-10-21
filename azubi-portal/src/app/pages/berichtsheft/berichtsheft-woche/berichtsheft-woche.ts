import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '@app/services/auth';
import { BerichtsheftService } from '@app/services/berichtsheft.service';
import { PersonLernzielService } from '@app/services/person-lernziel.service';
import {
  ART_LABELS,
  EintragArt,
  KIND_LABELS,
  PersonLernziel,
  WochenTag,
  Wochenbericht,
} from '@app/core/models';
import { addDays, errorMessage, normalizeSearch, today } from '@app/core/utils';

interface TagForm {
  hours: number;
  art: EintragArt;
  description: string;
  lernzielIds: number[];
  dirty: boolean;
  saving: boolean;
  showLernziele: boolean;
  lernzielFilter: string;
  error: string;
}

/**
 * Wochenansicht des Berichtshefts.
 * - Azubis: eigene Woche erfassen, speichern und einreichen.
 * - Ausbilder (Route /berichtsheft/azubis/:personId): Woche ansehen, abzeichnen oder zurückgeben.
 */
@Component({
  selector: 'app-berichtsheft-woche',
  imports: [FormsModule, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './berichtsheft-woche.html',
  styleUrl: './berichtsheft-woche.css',
})
export class BerichtsheftWoche {
  protected readonly auth = inject(Auth);
  private readonly service = inject(BerichtsheftService);
  private readonly personLernzielService = inject(PersonLernzielService);
  private readonly router = inject(Router);

  /** Aus der Route (nur Ausbilder-Ansicht). */
  readonly personId = input<string | undefined>();
  /** Query-Parameter ?datum=YYYY-MM-DD */
  readonly datum = input<string | undefined>();

  readonly artOptions = Object.entries(ART_LABELS) as [EintragArt, string][];
  readonly kindLabels = KIND_LABELS;

  readonly woche = signal<Wochenbericht | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly info = signal('');
  readonly forms = signal<Record<string, TagForm>>({});
  readonly meineLernziele = signal<PersonLernziel[]>([]);
  readonly showWeekend = signal(false);
  readonly busy = signal(false);
  kommentar = '';

  readonly fremdeAnsicht = computed(() => !!this.personId());
  readonly sichtbareTage = computed<WochenTag[]>(() => {
    const w = this.woche();
    if (!w) {
      return [];
    }
    return w.tage.filter((t, i) => i < 5 || this.showWeekend() || !!t.eintrag);
  });
  readonly hatUngespeichert = computed(() => Object.values(this.forms()).some((f) => f.dirty));
  readonly kannPruefen = computed(() => {
    const w = this.woche();
    return this.auth.isStaff() && !!w && w.status === 'EINGEREICHT' && w.id !== null;
  });

  private readonly lernzielMap = computed(() => {
    const map = new Map<number, PersonLernziel>();
    this.meineLernziele().forEach((pl) => map.set(pl.lernziel.id, pl));
    return map;
  });

  constructor() {
    effect(() => {
      const datum = this.datum() ?? today();
      const personId = this.personId();
      untracked(() => this.load(datum, personId ? Number(personId) : null));
    });

    if (this.auth.isLearner()) {
      this.personLernzielService.getMine().subscribe({
        next: (list) => this.meineLernziele.set(list),
        error: () => {},
      });
    }
  }

  load(datum: string, personId: number | null): void {
    this.loading.set(true);
    this.error.set('');
    this.service.getWoche(datum, personId).subscribe({
      next: (w) => {
        this.woche.set(w);
        this.initForms(w);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err, 'Woche konnte nicht geladen werden'));
        this.loading.set(false);
      },
    });
  }

  // ---------------------------------------------------------- Navigation

  vorherigeWoche(): void {
    this.gotoDatum(addDays(this.woche()?.weekStart ?? today(), -7));
  }

  naechsteWoche(): void {
    this.gotoDatum(addDays(this.woche()?.weekStart ?? today(), 7));
  }

  dieseWoche(): void {
    this.gotoDatum(today());
  }

  gotoDatum(datum: string): void {
    if (!datum) {
      return;
    }
    if (this.hatUngespeichert() && !confirm('Es gibt ungespeicherte Änderungen. Trotzdem wechseln?')) {
      return;
    }
    this.router.navigate([], { queryParams: { datum }, queryParamsHandling: 'merge' });
  }

  // ---------------------------------------------------------- Erfassen

  form(date: string): TagForm {
    return this.forms()[date];
  }

  change(date: string, patch: Partial<TagForm>): void {
    this.forms.update((all) => ({ ...all, [date]: { ...all[date], ...patch, dirty: true } }));
  }

  setUi(date: string, patch: Partial<TagForm>): void {
    this.forms.update((all) => ({ ...all, [date]: { ...all[date], ...patch } }));
  }

  onArtChange(date: string, art: EintragArt): void {
    const form = this.form(date);
    const patch: Partial<TagForm> = { art };
    // sinnvolle Standardstunden vorschlagen
    if (form.hours === 0 || form.hours === 8 || form.hours === 6) {
      patch.hours = art === 'SCHULE' ? 6 : art === 'BETRIEB' || art === 'SONSTIGES' ? 8 : 0;
    }
    this.change(date, patch);
  }

  toggleLernziel(date: string, lernzielId: number): void {
    const ids = this.form(date).lernzielIds;
    this.change(date, {
      lernzielIds: ids.includes(lernzielId) ? ids.filter((id) => id !== lernzielId) : [...ids, lernzielId],
    });
  }

  lernzielTitel(id: number, tag: WochenTag): string {
    return (
      this.lernzielMap().get(id)?.lernziel.title ??
      tag.eintrag?.lernziele.find((l) => l.id === id)?.title ??
      `Lernziel #${id}`
    );
  }

  gefilterteLernziele(date: string): PersonLernziel[] {
    const filter = normalizeSearch(this.form(date).lernzielFilter);
    return this.meineLernziele().filter(
      (pl) => !filter || normalizeSearch(pl.lernziel.title).includes(filter),
    );
  }

  speichern(tag: WochenTag): void {
    const form = this.form(tag.date);
    if (!form.description.trim() && (form.art === 'BETRIEB' || form.art === 'SCHULE')) {
      this.setUi(tag.date, { error: 'Bitte beschreibe kurz deine Tätigkeiten.' });
      return;
    }
    this.setUi(tag.date, { saving: true, error: '' });
    this.service
      .saveEintrag({
        date: tag.date,
        hours: Number(form.hours) || 0,
        art: form.art,
        description: form.description.trim() || null,
        lernzielIds: form.lernzielIds,
      })
      .subscribe({
        next: (eintrag) => {
          this.woche.update((w) =>
            w
              ? {
                  ...w,
                  tage: w.tage.map((t) => (t.date === tag.date ? { ...t, eintrag } : t)),
                  gesamtStunden: w.tage.reduce(
                    (sum, t) => sum + (t.date === tag.date ? eintrag.hours : (t.eintrag?.hours ?? 0)),
                    0,
                  ),
                }
              : w,
          );
          this.setUi(tag.date, { saving: false, dirty: false, showLernziele: false });
          this.flash('Eintrag gespeichert');
          // Lernziel-Status kann sich geändert haben (Offen → In Bearbeitung)
          this.personLernzielService.getMine().subscribe((list) => this.meineLernziele.set(list));
        },
        error: (err) => this.setUi(tag.date, { saving: false, error: errorMessage(err) }),
      });
  }

  loeschen(tag: WochenTag): void {
    if (!tag.eintrag || !confirm(`Eintrag vom ${tag.wochentag} wirklich löschen?`)) {
      return;
    }
    this.service.deleteEintrag(tag.eintrag.id).subscribe({
      next: () => this.reload('Eintrag gelöscht'),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  einreichen(): void {
    const w = this.woche();
    if (!w) {
      return;
    }
    if (this.hatUngespeichert()) {
      this.error.set('Bitte speichere zuerst alle geänderten Tage.');
      return;
    }
    if (!confirm(`KW ${w.kalenderwoche} jetzt zur Prüfung einreichen? Danach ist keine Bearbeitung mehr möglich.`)) {
      return;
    }
    this.busy.set(true);
    this.service.einreichen(w.weekStart).subscribe({
      next: (neu) => {
        this.busy.set(false);
        this.woche.set(neu);
        this.initForms(neu);
        this.flash('Woche eingereicht – dein Ausbilder wurde benachrichtigt.');
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  // ---------------------------------------------------------- Prüfen (Ausbilder)

  abzeichnen(): void {
    const w = this.woche();
    if (!w?.id) {
      return;
    }
    this.busy.set(true);
    this.service.abzeichnen(w.id, this.kommentar.trim() || null).subscribe({
      next: (neu) => this.afterReview(neu, 'Woche abgezeichnet'),
      error: (err) => this.reviewError(err),
    });
  }

  zurueckgeben(): void {
    const w = this.woche();
    if (!w?.id) {
      return;
    }
    if (!this.kommentar.trim()) {
      this.error.set('Bitte gib im Kommentar an, was überarbeitet werden soll.');
      return;
    }
    this.busy.set(true);
    this.service.ablehnen(w.id, this.kommentar.trim()).subscribe({
      next: (neu) => this.afterReview(neu, 'Woche zur Überarbeitung zurückgegeben'),
      error: (err) => this.reviewError(err),
    });
  }

  drucken(): void {
    window.print();
  }

  // ---------------------------------------------------------- intern

  private afterReview(neu: Wochenbericht, message: string): void {
    this.busy.set(false);
    this.kommentar = '';
    this.woche.set(neu);
    this.flash(message);
  }

  private reviewError(err: unknown): void {
    this.busy.set(false);
    this.error.set(errorMessage(err));
  }

  private reload(message: string): void {
    const w = this.woche();
    const personId = this.personId();
    if (w) {
      this.load(w.weekStart, personId ? Number(personId) : null);
    }
    this.flash(message);
  }

  private flash(message: string): void {
    this.info.set(message);
    setTimeout(() => this.info.set(''), 3000);
  }

  private initForms(w: Wochenbericht): void {
    const forms: Record<string, TagForm> = {};
    for (const tag of w.tage) {
      const e = tag.eintrag;
      const wochenende = w.tage.indexOf(tag) >= 5;
      forms[tag.date] = {
        hours: e?.hours ?? (wochenende ? 0 : 8),
        art: e?.art ?? 'BETRIEB',
        description: e?.description ?? '',
        lernzielIds: e?.lernziele.map((l) => l.id) ?? [],
        dirty: false,
        saving: false,
        showLernziele: false,
        lernzielFilter: '',
        error: '',
      };
    }
    this.forms.set(forms);
  }
}
