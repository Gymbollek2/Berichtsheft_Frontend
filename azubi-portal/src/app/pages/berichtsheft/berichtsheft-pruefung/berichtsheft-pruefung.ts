import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BerichtsheftService } from '@app/services/berichtsheft.service';
import { WochenberichtSummary } from '@app/core/models';
import { errorMessage } from '@app/core/utils';

/** Warteschlange der eingereichten Wochen für Ausbilder. */
@Component({
  selector: 'app-berichtsheft-pruefung',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './berichtsheft-pruefung.html',
})
export class BerichtsheftPruefung implements OnInit {
  private readonly service = inject(BerichtsheftService);

  readonly offen = signal<WochenberichtSummary[]>([]);
  readonly error = signal('');
  readonly loading = signal(true);

  ngOnInit(): void {
    this.service.getOffen().subscribe({
      next: (list) => {
        this.offen.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
