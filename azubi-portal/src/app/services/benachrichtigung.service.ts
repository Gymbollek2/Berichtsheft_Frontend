import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Benachrichtigung, Benachrichtigungen } from '@app/core/models';
import { Auth } from '@app/services/auth';

/** Wie oft im Hintergrund nach neuen Benachrichtigungen gefragt wird (Absicherung, falls die Live-Verbindung fehlt). */
const ABFRAGE_MS = 60_000;
/** Wartezeit vor einem neuen Verbindungsversuch – verdoppelt sich bei jedem Fehlschlag bis zum Höchstwert. */
const NEUVERBINDEN_MS = 2_000;
const NEUVERBINDEN_MAX_MS = 60_000;
/** Mehrere Meldungen kurz hintereinander (z. B. an mehrere Empfänger) nur einmal laden. */
const SAMMELN_MS = 200;

/**
 * Benachrichtigungen des angemeldeten Benutzers (Glocke oben rechts). Eine offene Live-Verbindung
 * (Server-Sent Events) meldet jede Änderung sofort; zusätzlich wird regelmäßig die Anzahl der ungelesenen
 * abgefragt und die Liste nur neu geladen, wenn sich etwas geändert hat.
 */
@Injectable({ providedIn: 'root' })
export class BenachrichtigungService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly url = '/v1/benachrichtigung';

  readonly ungelesen = signal(0);
  readonly eintraege = signal<Benachrichtigung[]>([]);
  readonly geladen = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private live: AbortController | null = null;
  private neuverbindenTimer: ReturnType<typeof setTimeout> | null = null;
  private neuverbindenMs = NEUVERBINDEN_MS;
  private sammelnTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly beiRueckkehr = () => {
    if (document.visibilityState === 'visible') {
      this.anzahlPruefen();
    }
  };

  /** Startet Live-Verbindung und Abfrage (jede Minute und beim Zurückkehren in den Tab). */
  starten(): void {
    if (this.timer) {
      return;
    }
    this.laden();
    this.timer = setInterval(() => this.anzahlPruefen(), ABFRAGE_MS);
    document.addEventListener('visibilitychange', this.beiRueckkehr);
    this.verbinden();
  }

  stoppen(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.live?.abort();
    this.live = null;
    for (const t of [this.neuverbindenTimer, this.sammelnTimer]) {
      if (t) {
        clearTimeout(t);
      }
    }
    this.neuverbindenTimer = null;
    this.sammelnTimer = null;
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

  /**
   * Live-Verbindung zum Server. Über fetch statt EventSource, weil nur so das Token im Header mitgeht.
   * Bricht sie ab (Server neu gestartet, Netzwerk weg), wird sie mit wachsendem Abstand neu aufgebaut.
   */
  private async verbinden(): Promise<void> {
    const token = this.auth.getToken();
    if (!token || !this.timer) {
      return;
    }
    const steuerung = new AbortController();
    this.live = steuerung;
    try {
      const antwort = await fetch(`${this.url}/live`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        cache: 'no-store',
        signal: steuerung.signal,
      });
      if (antwort.status === 401) {
        // Sitzung abgelaufen – die nächste normale Anfrage meldet ab
        this.anzahlPruefen();
        return;
      }
      if (!antwort.ok || !antwort.body) {
        throw new Error(`Live-Verbindung: HTTP ${antwort.status}`);
      }
      // Was während der Unterbrechung passiert ist, nachholen
      this.anzahlPruefen();
      await this.ereignisseLesen(antwort.body, () => (this.neuverbindenMs = NEUVERBINDEN_MS));
    } catch {
      // Abbruch oder Netzwerkfehler – unten neu verbinden
    }
    if (this.live === steuerung && !steuerung.signal.aborted) {
      this.live = null;
      this.neuverbindenTimer = setTimeout(() => this.verbinden(), this.neuverbindenMs);
      this.neuverbindenMs = Math.min(this.neuverbindenMs * 2, NEUVERBINDEN_MAX_MS);
    }
  }

  /** Liest den Ereignisstrom; jedes Ereignis „benachrichtigung“ lädt die Liste neu. */
  private async ereignisseLesen(body: ReadableStream<Uint8Array>, verbunden: () => void): Promise<void> {
    const leser = body.getReader();
    const decoder = new TextDecoder();
    let puffer = '';
    for (;;) {
      const { value, done } = await leser.read();
      if (done) {
        return;
      }
      puffer += decoder.decode(value, { stream: true }).replace(/\r\n?/g, '\n');
      let ende: number;
      while ((ende = puffer.indexOf('\n\n')) >= 0) {
        const block = puffer.slice(0, ende);
        puffer = puffer.slice(ende + 2);
        const name = /^event:\s*(.*)$/m.exec(block)?.[1];
        if (name === 'verbunden') {
          verbunden();
        } else if (name === 'benachrichtigung') {
          this.gesammeltLaden();
        }
      }
    }
  }

  private gesammeltLaden(): void {
    if (this.sammelnTimer) {
      clearTimeout(this.sammelnTimer);
    }
    this.sammelnTimer = setTimeout(() => {
      this.sammelnTimer = null;
      this.laden();
    }, SAMMELN_MS);
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
