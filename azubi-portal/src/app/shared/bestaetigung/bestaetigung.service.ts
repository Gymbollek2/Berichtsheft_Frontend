import { Injectable, signal } from '@angular/core';

export interface Rueckfrage {
  titel: string;
  text: string;
  /** Kurze Zusammenfassung unter dem Text, z. B. Woche und Stunden. */
  details?: { label: string; wert: string }[];
  /** Beschriftung des Bestätigen-Buttons, z. B. „Jetzt abgeben“. */
  bestaetigen: string;
  /** Beschriftung des Abbrechen-Buttons, z. B. „Weiter bearbeiten“. */
  abbrechen?: string;
  /** Font-Awesome-Symbol (ohne „fa-solid“), z. B. „fa-paper-plane“. */
  icon?: string;
  /** „gefahr“ für Löschen u. Ä. (roter Button, Fokus auf Abbrechen). */
  ton?: 'brand' | 'gefahr';
  /** Optionales Eingabefeld (z. B. Link-Adresse). */
  eingabe?: { label: string; wert: string; typ?: 'text' | 'url' };
}

export interface OffeneRueckfrage extends Rueckfrage {
  antwort: (ergebnis: { ok: boolean; wert: string }) => void;
}

/**
 * Rückfragen im Design der Anwendung statt der Browser-Fenster (confirm/prompt).
 * Angezeigt werden sie von {@link BestaetigungDialog} im Seitenrahmen.
 */
@Injectable({ providedIn: 'root' })
export class BestaetigungService {
  readonly offen = signal<OffeneRueckfrage | null>(null);

  /** true, wenn bestätigt wurde. */
  async frage(rueckfrage: Rueckfrage): Promise<boolean> {
    return (await this.oeffnen(rueckfrage)).ok;
  }

  /** Eingegebener Text oder null bei Abbruch. */
  async eingabe(
    rueckfrage: Rueckfrage & { eingabe: NonNullable<Rueckfrage['eingabe']> },
  ): Promise<string | null> {
    const { ok, wert } = await this.oeffnen(rueckfrage);
    return ok ? wert : null;
  }

  antworten(ok: boolean, wert = ''): void {
    const offen = this.offen();
    this.offen.set(null);
    offen?.antwort({ ok, wert });
  }

  private oeffnen(rueckfrage: Rueckfrage): Promise<{ ok: boolean; wert: string }> {
    // Eine noch offene Rückfrage gilt als abgebrochen
    this.antworten(false);
    return new Promise((resolve) => this.offen.set({ ...rueckfrage, antwort: resolve }));
  }
}
