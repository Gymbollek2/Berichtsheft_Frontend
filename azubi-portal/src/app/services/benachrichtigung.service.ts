import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Benachrichtigung, Benachrichtigungen } from '@app/core/models';

/** Wie oft im Hintergrund nach neuen Benachrichtigungen gefragt wird. */
const ABFRAGE_MS = 60_000;

/**
 * Benachrichtigungen des angemeldeten Benutzers (Glocke oben rechts). Fragt im Hintergrund regelmäßig
 * die Anzahl der ungelesenen ab und lädt die Liste nur, wenn sich etwas geändert hat.
 */
@Injectable({ providedIn: 'root' })
export class BenachrichtigungService {
  private readonly http = inject(HttpClient);
  private readonly url = '/v1/benachrichtigung';

  readonly ungelesen = signal(0);
  readonly eintraege = signal<Benachrichtigung[]>([]);
  readonly geladen = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly beiRueckkehr = () => {
    if (document.visibilityState === 'visible') {
      this.anzahlPruefen();
    }
  };

  /** Startet die Abfrage (jede Minute und beim Zurückkehren in den Tab). */
  starten(): void {
    if (this.timer) {
      return;
    }
    this.laden();
    this.timer = setInterval(() => this.anzahlPruefen(), ABFRAGE_MS);
    document.addEventListener('visibilitychange', this.beiRueckkehr);
  }

  stoppen(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    document.removeEventListener('visibilitychange', this.beiRueckkehr);
    this.ungelesen.set(0);
    this.eintraege.set([]);
    this.geladen.set(false);
  }

  laden(): void {
    this.http.get<Benachrichtigungen>(this.url).subscribe({
      next: (antwort) => {
        this.ungelesen.set(antwort.ungelesen);
        this.eintraege.set(antwort.eintraege);
        this.geladen.set(true);
      },
      // Fehler (z. B. Server kurz weg) nicht anzeigen – die nächste Abfrage versucht es erneut
      error: () => this.geladen.set(true),
    });
  }

  /** Lädt die Liste nur neu, wenn sich die Anzahl der ungelesenen geändert hat. */
  anzahlPruefen(): void {
    this.http.get<{ ungelesen: number }>(`${this.url}/anzahl`).subscribe({
      next: ({ ungelesen }) => {
        if (ungelesen !== this.ungelesen() || !this.geladen()) {
          this.laden();
        }
      },
      error: () => undefined,
    });
  }

  markiereGelesen(nachricht: Benachrichtigung): void {
    if (nachricht.gelesen) {
      return;
    }
    // Sofort anzeigen, der Server zieht nach
    this.eintraege.update((alle) =>
      alle.map((n) => (n.id === nachricht.id ? { ...n, gelesen: true } : n)),
    );
    this.ungelesen.update((n) => Math.max(0, n - 1));
    this.http
      .post(`${this.url}/${nachricht.id}/gelesen`, {})
      .subscribe({ error: () => this.laden() });
  }

  alleGelesen(): void {
    this.eintraege.update((alle) => alle.map((n) => ({ ...n, gelesen: true })));
    this.ungelesen.set(0);
    this.http.post(`${this.url}/gelesen`, {}).subscribe({ error: () => this.laden() });
  }
}
