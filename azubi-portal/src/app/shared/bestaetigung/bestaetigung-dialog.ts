import { Component, ElementRef, afterRenderEffect, effect, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BestaetigungService } from './bestaetigung.service';

/**
 * Anzeige der Rückfragen aus {@link BestaetigungService} als modales Fenster (natives &lt;dialog&gt;:
 * Fokus bleibt im Fenster, Esc bricht ab). Einmal im Seitenrahmen eingebunden.
 */
@Component({
  selector: 'app-bestaetigung-dialog',
  imports: [FormsModule],
  templateUrl: './bestaetigung-dialog.html',
  styleUrl: './bestaetigung-dialog.css',
})
export class BestaetigungDialog {
  protected readonly service = inject(BestaetigungService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  wert = '';

  constructor() {
    // Startwert des Eingabefelds, bevor der Inhalt gezeichnet wird
    effect(() => {
      this.wert = this.service.offen()?.eingabe?.wert ?? '';
    });
    // Erst öffnen, wenn der Inhalt gezeichnet ist – dann setzt showModal() den Fokus auf den richtigen Button
    afterRenderEffect(() => {
      const frage = this.service.offen();
      const dialog = this.dialog().nativeElement;
      if (frage && !dialog.open) {
        dialog.showModal();
      } else if (!frage && dialog.open) {
        dialog.close();
      }
    });
  }

  bestaetigen(): void {
    const frage = this.service.offen();
    if (frage?.eingabe && !this.wert.trim()) {
      return;
    }
    this.service.antworten(true, this.wert.trim());
  }

  abbrechen(): void {
    this.service.antworten(false);
  }

  /** Esc: der Browser schließt das Fenster selbst – nur die Antwort weitergeben. */
  beiEsc(event: Event): void {
    event.preventDefault();
    this.abbrechen();
  }

  /** Klick auf den abgedunkelten Hintergrund bricht ab. */
  beiKlick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.abbrechen();
    }
  }
}
