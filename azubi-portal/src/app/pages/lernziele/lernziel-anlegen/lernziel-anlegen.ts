import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LernzielService } from '@app/services/lernziel.service';
import { KIND_LABELS, Kind, Lernziel, REQUIRED_PARENT_KIND } from '@app/core/models';
import { errorMessage } from '@app/core/utils';

/**
 * Lernziel anlegen (/lernziel-anlegen, optional ?kind=&parentId= für ein Unterziel)
 * oder bearbeiten (/lernziel-bearbeiten/:id).
 *
 * Hierarchie: Richtlernziel hat kein übergeordnetes Lernziel, Groblernziel gehört zu einem
 * Richtlernziel, Feinlernziel zu einem Groblernziel. Die Auswahl zeigt nur passende Lernziele.
 */
@Component({
  selector: 'app-lernziel-anlegen',
  imports: [FormsModule, RouterLink],
  templateUrl: './lernziel-anlegen.html',
})
export class LernzielAnlegen {
  private readonly service = inject(LernzielService);
  private readonly router = inject(Router);

  /** Pfad-Parameter beim Bearbeiten. */
  readonly id = input<string | undefined>();
  /** Query-Parameter zum Vorbelegen ("Unterziel anlegen"). */
  readonly kindParam = input<string | undefined>(undefined, { alias: 'kind' });
  readonly parentIdParam = input<string | undefined>(undefined, { alias: 'parentId' });

  readonly kindOptions = Object.entries(KIND_LABELS) as [Kind, string][];
  readonly kindLabels = KIND_LABELS;

  readonly title = signal('');
  readonly description = signal('');
  readonly kind = signal<Kind>('KIND_GENERAL');
  readonly parentId = signal<number | null>(null);
  readonly parentOptions = signal<Lernziel[]>([]);
  readonly anzahlUntergeordnet = signal(0);
  readonly error = signal('');
  readonly saving = signal(false);

  readonly isEdit = computed(() => !!this.id());
  readonly parentKind = computed(() => REQUIRED_PARENT_KIND[this.kind()]);
  /** Art ist gesperrt, solange Unterziele zugeordnet sind. */
  readonly kindLocked = computed(() => this.anzahlUntergeordnet() > 0);

  constructor() {
    // Vorbelegung bzw. vorhandenes Lernziel laden
    effect(() => {
      const id = this.id();
      const kindParam = this.kindParam();
      const parentParam = this.parentIdParam();
      untracked(() => {
        if (id) {
          this.service.getById(Number(id)).subscribe({
            next: (l) => {
              this.title.set(l.title);
              this.description.set(l.description ?? '');
              this.kind.set(l.kind);
              this.parentId.set(l.parentId);
              this.anzahlUntergeordnet.set(l.anzahlUntergeordnet);
            },
            error: (err) => this.error.set(errorMessage(err)),
          });
        } else {
          this.title.set('');
          this.description.set('');
          this.kind.set(kindParam && kindParam in KIND_LABELS ? (kindParam as Kind) : 'KIND_GENERAL');
          this.parentId.set(parentParam ? Number(parentParam) : null);
          this.anzahlUntergeordnet.set(0);
        }
      });
    });

    // Passende übergeordnete Lernziele zur gewählten Art laden
    effect(() => {
      const kind = this.kind();
      untracked(() => {
        if (!REQUIRED_PARENT_KIND[kind]) {
          this.parentOptions.set([]);
          this.parentId.set(null);
          return;
        }
        this.service.getParentOptions(kind).subscribe({
          next: (options) => {
            this.parentOptions.set(options);
            const current = this.parentId();
            if (current !== null && !options.some((o) => o.id === current)) {
              this.parentId.set(null);
            }
          },
          error: (err) => this.error.set(errorMessage(err)),
        });
      });
    });
  }

  speichern(): void {
    const parentKind = this.parentKind();
    if (!this.title().trim()) {
      this.error.set('Bitte gib eine Bezeichnung ein.');
      return;
    }
    if (parentKind && !this.parentId()) {
      this.error.set(`Bitte wähle das ${KIND_LABELS[parentKind]}, zu dem dieses ${KIND_LABELS[this.kind()]} gehört.`);
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const request = {
      title: this.title().trim(),
      description: this.description().trim() || null,
      kind: this.kind(),
      parentId: parentKind ? Number(this.parentId()) : null,
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
}
