import { Component, HostListener, OnDestroy, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '@app/services/auth';
import { BerichtsheftService } from '@app/services/berichtsheft.service';
import { PersonLernzielService } from '@app/services/person-lernziel.service';
import {
  ABWESEND,
  ART_LABELS,
  EintragArt,
  MAX_STUNDEN,
  PersonLernziel,
  WochenTag,
  Wochenbericht,
} from '@app/core/models';
import { addDays, errorMessage, normalizeSearch, today } from '@app/core/utils';
import { KannVerlassen } from '@app/guards/unsaved-changes.guard';
import { MarkdownEditor } from '@app/shared/markdown-editor/markdown-editor';
import { MarkdownPipe } from '@app/shared/markdown.pipe';

/** Warum ein Tag nicht bearbeitet werden kann (null = bearbeitbar). */
export type TagSperre = 'zukunft' | 'vor-beginn' | null;

/** Gesamtzustand des automatischen Speicherns (Anzeige oben auf der Seite). */
export type SpeicherStatus = 'gespeichert' | 'ausstehend' | 'speichert' | 'unvollstaendig' | 'fehler';

/** Wartezeit nach der letzten Eingabe, bevor automatisch gespeichert wird. */
const AUTOSAVE_DELAY_MS = 1500;

interface TagForm {
  hours: number;
  art: EintragArt;
  description: string;
  lernzielIds: number[];
  dirty: boolean;
  saving: boolean;
  /** Zählt jede Änderung hoch – so erkennen wir Eingaben während eines laufenden Speichervorgangs. */
  rev: number;
  showLernziele: boolean;
  lernzielFilter: string;
  /** Fehler beim Speichern (z. B. vom Server). */
  error: string;
  /** Pflichtangaben fehlen noch – es wird gespeichert, sobald sie ausgefüllt sind. */
  hinweis: string;
}

/**
 * Wochenansicht des Berichtshefts.
 * - Azubis: eigene Woche erfassen, speichern und einreichen.
 * - Ausbilder (Route /berichtsheft/azubis/:personId): Woche ansehen, abzeichnen oder zurückgeben.
 */
@Component({
  selector: 'app-berichtsheft-woche',
  imports: [FormsModule, DatePipe, DecimalPipe, RouterLink, MarkdownEditor, MarkdownPipe],
  templateUrl: './berichtsheft-woche.html',
  styleUrl: './berichtsheft-woche.css',
})
export class BerichtsheftWoche implements OnDestroy, KannVerlassen {
  protected readonly auth = inject(Auth);
  private readonly service = inject(BerichtsheftService);
  private readonly personLernzielService = inject(PersonLernzielService);
  private readonly router = inject(Router);

  /** Aus der Route (nur Ausbilder-Ansicht). */
  readonly personId = input<string | undefined>();
  /** Query-Parameter ?datum=YYYY-MM-DD */
  readonly datum = input<string | undefined>();

  readonly artOptions = Object.entries(ART_LABELS) as [EintragArt, string][];
  readonly maxStunden = MAX_STUNDEN;
  readonly heute = today();

  readonly woche = signal<Wochenbericht | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly info = signal('');
  readonly forms = signal<Record<string, TagForm>>({});
  readonly meineLernziele = signal<PersonLernziel[]>([]);
  readonly showWeekend = signal(false);
  readonly busy = signal(false);
  /** Zeitpunkt der letzten erfolgreichen automatischen Speicherung. */
  readonly letzteSpeicherung = signal<Date | null>(null);
  kommentar = '';

  /** Geplante Autosave-Timer je Tag (Datum → Timer). */
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  /** Laufende Speichervorgänge je Tag. */
  private readonly laufend = new Map<string, Promise<boolean>>();

  readonly fremdeAnsicht = computed(() => !!this.personId());
  readonly sichtbareTage = computed<WochenTag[]>(() => {
    const w = this.woche();
    if (!w) {
      return [];
    }
    return w.tage.filter((t, i) => i < 5 || this.showWeekend() || !!t.eintrag);
  });
  readonly hatUngespeichert = computed(() => Object.values(this.forms()).some((f) => f.dirty));

  readonly speicherStatus = computed<SpeicherStatus>(() => {
    const forms = Object.values(this.forms());
    if (forms.some((f) => f.saving)) {
      return 'speichert';
    }
    if (forms.some((f) => f.dirty && f.error)) {
      return 'fehler';
    }
    if (forms.some((f) => f.dirty && f.hinweis)) {
      return 'unvollstaendig';
    }
    if (forms.some((f) => f.dirty)) {
      return 'ausstehend';
    }
    return 'gespeichert';
  });
  readonly kannPruefen = computed(() => {
    const w = this.woche();
    return this.auth.isStaff() && !!w && w.status === 'EINGEREICHT' && w.id !== null;
  });

  private readonly lernzielMap = computed(() => {
    const map = new Map<number, PersonLernziel>();
    this.meineLernziele().forEach((pl) => map.set(pl.lernziel.id, pl));
    return map;
  });

  /** Tätigkeiten werden Feinlernzielen zugeordnet – gruppiert nach ihrem Groblernziel. */
  private readonly feinlernziele = computed(() =>
    this.meineLernziele()
      .filter((pl) => pl.lernziel.kind === 'KIND_SPECIFIC')
      .sort(
        (a, b) =>
          this.parentTitle(a).localeCompare(this.parentTitle(b), 'de') ||
          a.lernziel.title.localeCompare(b.lernziel.title, 'de'),
      ),
  );

  /** Fehlende Werktage (Mo–Fr) der angezeigten Woche. */
  readonly fehlendeTage = computed(() => {
    const w = this.woche();
    if (!w) {
      return [];
    }
    return w.tage
      .slice(0, 5)
      .filter((t) => !t.eintrag && this.sperre(t.date) !== 'vor-beginn')
      .map((t) => t.wochentag);
  });

  /** Ab Freitag und mit Einträgen für alle Werktage darf eingereicht werden. */
  readonly einreichHinweis = computed<string | null>(() => {
    const w = this.woche();
    if (!w) {
      return null;
    }
    const freitag = addDays(w.weekStart, 4);
    if (this.heute < freitag) {
      return `Einreichen ist ab Freitag, ${this.formatDate(freitag)}, möglich.`;
    }
    if (this.fehlendeTage().length) {
      return `Es fehlen noch: ${this.fehlendeTage().join(', ')}. Urlaub, Krankheit und Feiertage bitte als solche eintragen.`;
    }
    if (this.hatUngespeichert()) {
      return this.speicherStatus() === 'fehler' || this.speicherStatus() === 'unvollstaendig'
        ? 'Einige Änderungen konnten noch nicht gespeichert werden – bitte die markierten Tage prüfen.'
        : 'Änderungen werden gespeichert …';
    }
    return null;
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

  /** Beim Verlassen der Seite (z. B. über die Seitenleiste) offene Änderungen sofort speichern. */
  ngOnDestroy(): void {
    void this.allesSpeichern();
  }

  /** Browser-Tab schließen/neu laden: offene Änderungen speichern und ggf. warnen. */
  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.hatUngespeichert()) {
      void this.allesSpeichern();
      event.preventDefault();
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
    void this.gotoDatum(addDays(this.woche()?.weekStart ?? today(), -7));
  }

  naechsteWoche(): void {
    void this.gotoDatum(addDays(this.woche()?.weekStart ?? today(), 7));
  }

  dieseWoche(): void {
    void this.gotoDatum(today());
  }

  async gotoDatum(datum: string): Promise<void> {
    if (!datum) {
      return;
    }
    if (!(await this.kannVerlassen())) {
      return;
    }
    this.router.navigate([], { queryParams: { datum }, queryParamsHandling: 'merge' });
  }

  /**
   * Speichert offene Änderungen und fragt nach, falls Tage unvollständig sind oder nicht gespeichert werden konnten.
   * Wird beim Wochenwechsel und vom Guard beim Verlassen der Seite (z. B. über die Seitenleiste) aufgerufen.
   */
  async kannVerlassen(): Promise<boolean> {
    if (await this.allesSpeichern()) {
      return true;
    }
    const tage = (this.woche()?.tage ?? [])
      .filter((t) => this.forms()[t.date]?.dirty)
      .map((t) => t.wochentag);
    return confirm(
      `Für ${tage.join(', ') || 'einige Tage'} gibt es Änderungen, die nicht gespeichert werden konnten ` +
        '(Pflichtfelder fehlen oder Fehler beim Speichern).\n\n' +
        'Seite trotzdem verlassen? Diese Änderungen gehen dann verloren.',
    );
  }

  // ---------------------------------------------------------- Erfassen

  sperre(date: string): TagSperre {
    if (date > this.heute) {
      return 'zukunft';
    }
    const start = this.auth.user()?.dateOfTrainingStart;
    if (start && date < start) {
      return 'vor-beginn';
    }
    return null;
  }

  istAbwesend(art: EintragArt): boolean {
    return ABWESEND.includes(art);
  }

  /** Lernziele gibt es nur an Betriebs- und sonstigen Tagen – nicht in der Berufsschule und nicht bei Abwesenheit. */
  mitLernzielen(art: EintragArt): boolean {
    return art !== 'SCHULE' && !this.istAbwesend(art);
  }

  parentTitle(pl: PersonLernziel): string {
    const parentId = pl.lernziel.parentId;
    return parentId ? (this.lernzielMap().get(parentId)?.lernziel.title ?? '') : '';
  }

  form(date: string): TagForm {
    return this.forms()[date];
  }

  /** Inhaltliche Änderung: markiert den Tag als geändert und plant das automatische Speichern. */
  change(date: string, patch: Partial<TagForm>): void {
    const current = this.forms()[date];
    if (!current) {
      return;
    }
    this.forms.update((all) => ({
      ...all,
      [date]: { ...current, ...patch, dirty: true, rev: current.rev + 1, hinweis: '' },
    }));
    this.planeAutosave(date);
  }

  /** Reine Oberflächen-Änderung (wird nicht gespeichert). */
  setUi(date: string, patch: Partial<TagForm>): void {
    if (!this.forms()[date]) {
      return;
    }
    this.forms.update((all) => ({ ...all, [date]: { ...all[date], ...patch } }));
  }

  onArtChange(date: string, art: EintragArt): void {
    const form = this.form(date);
    const patch: Partial<TagForm> = { art };
    // sinnvolle Standardstunden vorschlagen (6 war früher die Vorgabe für die Berufsschule)
    if (form.hours === 0 || form.hours === 8 || form.hours === 6) {
      patch.hours = art === 'SCHULE' || art === 'BETRIEB' || art === 'SONSTIGES' ? 8 : 0;
    }
    // In der Berufsschule und an Urlaubs-, Krankheits- und Feiertagen gibt es keine Lernziele
    if (!this.mitLernzielen(art)) {
      patch.lernzielIds = [];
      patch.showLernziele = false;
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
    return this.feinlernziele().filter(
      (pl) => !filter || normalizeSearch(pl.lernziel.title + ' ' + this.parentTitle(pl)).includes(filter),
    );
  }

  // ---------------------------------------------------------- Automatisch speichern

  private planeAutosave(date: string): void {
    clearTimeout(this.timers.get(date));
    this.timers.set(
      date,
      setTimeout(() => {
        this.timers.delete(date);
        void this.speichern(date);
      }, AUTOSAVE_DELAY_MS),
    );
  }

  private stoppeAutosave(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
  }

  /** Speichert alle geänderten Tage sofort. true = danach ist nichts mehr ungespeichert. */
  allesSpeichern(): Promise<boolean> {
    const dates = Object.entries(this.forms())
      .filter(([date, f]) => f.dirty || this.laufend.has(date))
      .map(([date]) => date);
    return Promise.all(dates.map((d) => this.speichern(d))).then((ok) => ok.every(Boolean));
  }

  /**
   * Speichert einen Tag sofort (wird vom Autosave und von „Erneut versuchen“ aufgerufen).
   * Ergebnis: true, wenn der Tag danach vollständig gespeichert ist.
   */
  speichern(date: string): Promise<boolean> {
    clearTimeout(this.timers.get(date));
    this.timers.delete(date);

    // Läuft schon ein Speichervorgang, danach erneut prüfen (es könnte weitergetippt worden sein).
    const laeuft = this.laufend.get(date);
    if (laeuft) {
      return laeuft.then(() => this.speichern(date));
    }

    const form = this.forms()[date];
    if (!form?.dirty) {
      return Promise.resolve(true);
    }

    const problem = this.pruefen(form);
    if (problem) {
      this.setUi(date, problem);
      return Promise.resolve(false);
    }

    const rev = form.rev;
    const alteLernziele = this.woche()?.tage.find((t) => t.date === date)?.eintrag?.lernziele.map((l) => l.id) ?? [];
    this.setUi(date, { saving: true, error: '', hinweis: '' });

    const vorgang = new Promise<boolean>((resolve) => {
      this.service
        .saveEintrag({
          date,
          hours: Number(form.hours) || 0,
          art: form.art,
          description: form.description.trim() || null,
          lernzielIds: this.mitLernzielen(form.art) ? form.lernzielIds : [],
        })
        .subscribe({
          next: (eintrag) => {
            this.woche.update((w) =>
              w
                ? {
                    ...w,
                    tage: w.tage.map((t) => (t.date === date ? { ...t, eintrag } : t)),
                    gesamtStunden: w.tage.reduce(
                      (sum, t) => sum + (t.date === date ? eintrag.hours : (t.eintrag?.hours ?? 0)),
                      0,
                    ),
                  }
                : w,
            );
            this.letzteSpeicherung.set(eintrag.updatedAt ? new Date(eintrag.updatedAt) : new Date());
            this.error.set('');

            // Während des Speicherns weitergetippt? Dann bleibt der Tag geändert und wird erneut gespeichert.
            const aktuell = this.forms()[date];
            const nochGeaendert = !!aktuell && aktuell.rev !== rev;
            this.setUi(date, { saving: false, dirty: nochGeaendert });
            if (nochGeaendert) {
              this.planeAutosave(date);
            }

            // Lernziel-Status kann sich geändert haben (Offen → In Bearbeitung)
            if (!this.gleicheIds(alteLernziele, form.lernzielIds)) {
              this.personLernzielService.getMine().subscribe((list) => this.meineLernziele.set(list));
            }
            resolve(!nochGeaendert);
          },
          error: (err) => {
            this.setUi(date, { saving: false, error: errorMessage(err, 'Speichern fehlgeschlagen') });
            resolve(false);
          },
        });
    }).finally(() => this.laufend.delete(date));

    this.laufend.set(date, vorgang);
    return vorgang;
  }

  /** Prüft einen Tag vor dem Speichern. Liefert den anzuzeigenden Hinweis/Fehler oder null. */
  private pruefen(form: TagForm): Partial<TagForm> | null {
    const stunden = Number(form.hours) || 0;
    const anwesend = form.art === 'BETRIEB' || form.art === 'SCHULE';
    if (stunden < 0 || stunden > MAX_STUNDEN) {
      return { error: `Pro Tag sind 0 bis ${MAX_STUNDEN} Stunden möglich.`, hinweis: '' };
    }
    if (anwesend && stunden === 0) {
      return { hinweis: 'Wird automatisch gespeichert, sobald die Stunden angegeben sind.', error: '' };
    }
    if (anwesend && !form.description.trim()) {
      return {
        hinweis: `Wird automatisch gespeichert, sobald ${form.art === 'SCHULE' ? 'die Unterrichtsthemen' : 'die Tätigkeiten'} eingetragen sind.`,
        error: '',
      };
    }
    return null;
  }

  private gleicheIds(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((id) => b.includes(id));
  }

  loeschen(tag: WochenTag): void {
    if (!tag.eintrag || !confirm(`Eintrag vom ${tag.wochentag} wirklich löschen?`)) {
      return;
    }
    clearTimeout(this.timers.get(tag.date));
    this.timers.delete(tag.date);
    this.service.deleteEintrag(tag.eintrag.id).subscribe({
      next: () => this.reload('Eintrag gelöscht'),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  async einreichen(): Promise<void> {
    const w = this.woche();
    if (!w) {
      return;
    }
    await this.allesSpeichern();
    const hinweis = this.einreichHinweis();
    if (hinweis) {
      this.error.set(hinweis);
      return;
    }
    if (!confirm(`KW ${w.kalenderwoche} jetzt zur Prüfung einreichen? Danach ist keine Bearbeitung mehr möglich.`)) {
      return;
    }
    this.busy.set(true);
    this.service.einreichen(w.weekStart).subscribe({
      next: (neu) => {
        this.busy.set(false);
        this.error.set('');
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

  formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  private afterReview(neu: Wochenbericht, message: string): void {
    this.busy.set(false);
    this.error.set('');
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
    this.stoppeAutosave();
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
        rev: 0,
        showLernziele: false,
        lernzielFilter: '',
        error: '',
        hinweis: '',
      };
    }
    this.forms.set(forms);

    // Letzte Speicherung der angezeigten Woche – bleibt so auch nach dem Neuladen sichtbar.
    const zeiten = w.tage
      .map((t) => t.eintrag?.updatedAt)
      .filter((z): z is string => !!z)
      .map((z) => new Date(z).getTime())
      .filter((ms) => !Number.isNaN(ms));
    this.letzteSpeicherung.set(zeiten.length ? new Date(Math.max(...zeiten)) : null);
  }
}
