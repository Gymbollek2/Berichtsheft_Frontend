import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '@app/services/auth';
import { LernzielService } from '@app/services/lernziel.service';
import { CHILD_KIND, CsvImportResult, KIND_LABELS, Kind, Lernziel } from '@app/core/models';
import {
  BAUM_EBENEN,
  BaumEbene,
  einklappenFuerEbene,
  errorMessage,
  ladeBaumEbene,
  normalizeSearch,
  sichtbarerBaum,
  speichereBaumEbene,
  treeOrder,
} from '@app/core/utils';

interface TreeRow {
  lernziel: Lernziel;
  depth: number;
  hatKinder: boolean;
  eingeklappt: boolean;
}

const EBENE_KEY = 'lernziele.ebene';

/** Alle Lernziele als Baum (Richt → Grob → Fein), mit Suche, Bearbeiten, Löschen und CSV. */
@Component({
  selector: 'app-lernziel-view-all',
  imports: [FormsModule, RouterLink],
  templateUrl: './lernziel-view-all.html',
})
export class LernzielViewAll implements OnInit {
  protected readonly auth = inject(Auth);
  private readonly service = inject(LernzielService);

  readonly kindLabels = KIND_LABELS;
  readonly kindOptions = Object.entries(KIND_LABELS) as [Kind, string][];
  readonly childKind = CHILD_KIND;

  readonly lernziele = signal<Lernziel[]>([]);
  readonly error = signal('');
  readonly info = signal('');
  readonly search = signal('');
  readonly kindFilter = signal<Kind | ''>('');
  readonly importResult = signal<CsvImportResult | null>(null);
  readonly expanded = signal<Set<number>>(new Set());

  /** Ein-/Ausklappen des Baums */
  readonly ebenen = BAUM_EBENEN;
  readonly ebene = signal<BaumEbene>(ladeBaumEbene(EBENE_KEY));
  readonly eingeklappt = signal<Set<number>>(new Set());
  readonly baumModus = computed(() => !normalizeSearch(this.search()) && !this.kindFilter());

  /** Baumdarstellung ohne Filter, flache Trefferliste mit Filter. */
  readonly rows = computed<TreeRow[]>(() => {
    const all = this.lernziele();
    const q = normalizeSearch(this.search());
    const kind = this.kindFilter();
    if (q || kind) {
      return all
        .filter((l) => !kind || l.kind === kind)
        .filter((l) => !q || normalizeSearch(l.title + ' ' + (l.description ?? '')).includes(q))
        .map((lernziel) => ({ lernziel, depth: 0, hatKinder: false, eingeklappt: false }));
    }
    const geordnet = treeOrder(all, (l) => l.id, (l) => l.parentId);
    return sichtbarerBaum(geordnet, (l) => l.id, this.eingeklappt()).map((r) => ({
      lernziel: r.item,
      depth: r.depth,
      hatKinder: r.hatKinder,
      eingeklappt: r.eingeklappt,
    }));
  });

  readonly parentTitle = computed(() => {
    const map = new Map<number, string>();
    this.lernziele().forEach((l) => map.set(l.id, l.title));
    return map;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const ersterLoad = this.lernziele().length === 0;
    this.service.getAll().subscribe({
      next: (list) => {
        this.lernziele.set(list);
        if (ersterLoad) {
          this.zeigeEbene(this.ebene());
        }
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  /** Klappt den Baum bis zur gewählten Ebene auf (z. B. nur Richt- und Groblernziele). */
  zeigeEbene(ebene: BaumEbene): void {
    this.ebene.set(ebene);
    speichereBaumEbene(EBENE_KEY, ebene);
    this.eingeklappt.set(einklappenFuerEbene(this.lernziele(), (l) => l.id, (l) => l.kind, ebene));
  }

  /** Klappt die Unterziele eines Lernziels auf oder zu. */
  toggleKinder(id: number): void {
    this.eingeklappt.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  toggle(id: number): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  loeschen(l: Lernziel): void {
    if (l.anzahlUntergeordnet > 0) {
      this.error.set(`„${l.title}“ hat ${l.anzahlUntergeordnet} Unterziele. Bitte zuerst diese löschen.`);
      return;
    }
    if (!confirm(`Lernziel „${l.title}“ wirklich löschen? Der Fortschritt aller Azubis zu diesem Lernziel geht verloren.`)) {
      return;
    }
    this.service.delete(l.id).subscribe({
      next: () => {
        this.flash('Lernziel gelöscht');
        this.load();
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  exportCsv(): void {
    this.service.exportCsv().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lernziele.csv';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  importCsv(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) {
      return;
    }
    this.service.importCsv(file).subscribe({
      next: (result) => {
        this.importResult.set(result);
        inputEl.value = '';
        this.load();
      },
      error: (err) => {
        inputEl.value = '';
        this.error.set(errorMessage(err));
      },
    });
  }

  private flash(message: string): void {
    this.info.set(message);
    setTimeout(() => this.info.set(''), 3000);
  }
}
