import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '@app/services/auth';
import { LernzielService } from '@app/services/lernziel.service';
import { CsvImportResult, KIND_LABELS, Kind, Lernziel } from '@app/core/models';
import { errorMessage, normalizeSearch } from '@app/core/utils';

interface TreeRow {
  lernziel: Lernziel;
  depth: number;
}

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

  readonly lernziele = signal<Lernziel[]>([]);
  readonly error = signal('');
  readonly info = signal('');
  readonly search = signal('');
  readonly kindFilter = signal<Kind | ''>('');
  readonly importResult = signal<CsvImportResult | null>(null);
  readonly expanded = signal<Set<number>>(new Set());

  /** Baumdarstellung ohne Filter, flache Trefferliste mit Filter. */
  readonly rows = computed<TreeRow[]>(() => {
    const all = this.lernziele();
    const q = normalizeSearch(this.search());
    const kind = this.kindFilter();
    if (q || kind) {
      return all
        .filter((l) => !kind || l.kind === kind)
        .filter((l) => !q || normalizeSearch(l.title + ' ' + (l.description ?? '')).includes(q))
        .map((lernziel) => ({ lernziel, depth: 0 }));
    }
    const ids = new Set(all.map((l) => l.id));
    const children = new Map<number | null, Lernziel[]>();
    for (const l of all) {
      const parent = l.parentId !== null && ids.has(l.parentId) ? l.parentId : null;
      children.set(parent, [...(children.get(parent) ?? []), l]);
    }
    const result: TreeRow[] = [];
    const visit = (parent: number | null, depth: number) => {
      for (const l of children.get(parent) ?? []) {
        result.push({ lernziel: l, depth });
        visit(l.id, depth + 1);
      }
    };
    visit(null, 0);
    return result;
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
    this.service.getAll().subscribe({
      next: (list) => this.lernziele.set(list),
      error: (err) => this.error.set(errorMessage(err)),
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
    if (!confirm(`Lernziel „${l.title}“ wirklich löschen? Die Zuordnung bei allen Azubis geht verloren.`)) {
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
