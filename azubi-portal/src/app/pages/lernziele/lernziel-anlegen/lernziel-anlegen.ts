import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LernzielService } from '@app/services/lernziel.service';
import { KIND_LABELS, Kind, Lernziel } from '@app/core/models';
import { errorMessage } from '@app/core/utils';

/** Lernziel anlegen (/lernziel-anlegen) oder bearbeiten (/lernziel-bearbeiten/:id). */
@Component({
  selector: 'app-lernziel-anlegen',
  imports: [FormsModule, RouterLink],
  templateUrl: './lernziel-anlegen.html',
})
export class LernzielAnlegen {
  private readonly service = inject(LernzielService);
  private readonly router = inject(Router);

  readonly id = input<string | undefined>();

  readonly kindOptions = Object.entries(KIND_LABELS) as [Kind, string][];
  readonly kindLabels = KIND_LABELS;
  readonly alle = signal<Lernziel[]>([]);
  readonly error = signal('');
  readonly saving = signal(false);

  readonly title = signal('');
  readonly description = signal('');
  readonly kind = signal<Kind>('KIND_SPECIFIC');
  readonly parentId = signal<number | null>(null);

  readonly isEdit = computed(() => !!this.id());
  /** Mögliche übergeordnete Lernziele (nicht das Lernziel selbst). */
  readonly parentOptions = computed(() => this.alle().filter((l) => String(l.id) !== this.id()));

  constructor() {
    this.service.getAll().subscribe({
      next: (list) => this.alle.set(list),
      error: (err) => this.error.set(errorMessage(err)),
    });

    effect(() => {
      const id = this.id();
      untracked(() => {
        if (id) {
          this.service.getById(Number(id)).subscribe({
            next: (l) => {
              this.title.set(l.title);
              this.description.set(l.description ?? '');
              this.kind.set(l.kind);
              this.parentId.set(l.parentId);
            },
            error: (err) => this.error.set(errorMessage(err)),
          });
        } else {
          this.reset();
        }
      });
    });
  }

  speichern(): void {
    if (!this.title().trim()) {
      this.error.set('Bitte gib eine Bezeichnung ein.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const request = {
      title: this.title().trim(),
      description: this.description().trim() || null,
      kind: this.kind(),
      parentId: this.parentId() ? Number(this.parentId()) : null,
    };
    const id = this.id();
    const call$ = id ? this.service.update(Number(id), request) : this.service.create(request);
    call$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/lernziel-view-all']);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  private reset(): void {
    this.title.set('');
    this.description.set('');
    this.kind.set('KIND_SPECIFIC');
    this.parentId.set(null);
  }
}
