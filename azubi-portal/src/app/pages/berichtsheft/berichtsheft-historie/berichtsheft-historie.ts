import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BerichtsheftService } from '@app/services/berichtsheft.service';
import { WochenberichtSummary } from '@app/core/models';
import { addDays, errorMessage } from '@app/core/utils';

/** Alle Wochen des angemeldeten Azubis. */
@Component({
  selector: 'app-berichtsheft-historie',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './berichtsheft-historie.html',
})
export class BerichtsheftHistorie implements OnInit {
  private readonly service = inject(BerichtsheftService);

  readonly wochen = signal<WochenberichtSummary[]>([]);
  readonly error = signal('');
  readonly loading = signal(true);
  readonly gesamtStunden = computed(() => this.wochen().reduce((s, w) => s + w.gesamtStunden, 0));
  readonly abgezeichnet = computed(() => this.wochen().filter((w) => w.status === 'ABGEZEICHNET').length);

  weekEnd(weekStart: string): string {
    return addDays(weekStart, 6);
  }

  ngOnInit(): void {
    this.service.getHistorie().subscribe({
      next: (w) => {
        this.wochen.set(w);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
