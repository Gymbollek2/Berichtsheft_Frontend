import { Component, ElementRef, input, model, signal, viewChild } from '@angular/core';
import { MarkdownPipe } from '../markdown.pipe';

interface Format {
  label: string;
  icon: string;
  /** Tastenkürzel (mit Strg bzw. ⌘), nur zur Anzeige im Tooltip. */
  taste?: string;
  aktion: () => void;
}

/**
 * Texteingabe mit Formatierungsleiste. Gespeichert wird reiner Markdown-Text – man kann also
 * die Buttons nutzen oder Markdown direkt tippen (z. B. **fett**, *kursiv*, - Liste).
 * Unterstreichen gibt es in Markdown nicht, dafür wird `<u>…</u>` eingefügt.
 */
@Component({
  selector: 'app-markdown-editor',
  imports: [MarkdownPipe],
  templateUrl: './markdown-editor.html',
  styleUrl: './markdown-editor.css',
})
export class MarkdownEditor {
  readonly value = model('');
  readonly inputId = input('');
  readonly placeholder = input('');
  readonly rows = input(4);
  readonly maxlength = input(4000);

  readonly vorschau = signal(false);
  private readonly textarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('textarea');

  readonly formate: Format[][] = [
    [
      { label: 'Fett', icon: 'fa-bold', taste: 'B', aktion: () => this.umschliessen('**') },
      { label: 'Kursiv', icon: 'fa-italic', taste: 'I', aktion: () => this.umschliessen('*') },
      { label: 'Unterstrichen', icon: 'fa-underline', taste: 'U', aktion: () => this.umschliessen('<u>', '</u>') },
      { label: 'Durchgestrichen', icon: 'fa-strikethrough', aktion: () => this.umschliessen('~~') },
    ],
    [
      { label: 'Überschrift', icon: 'fa-heading', aktion: () => this.zeilenPraefix(() => '### ', /^#+ /) },
      { label: 'Aufzählung', icon: 'fa-list-ul', aktion: () => this.zeilenPraefix(() => '- ', /^[-*] /) },
      { label: 'Nummerierte Liste', icon: 'fa-list-ol', aktion: () => this.zeilenPraefix((i) => `${i + 1}. `, /^\d+\. /) },
      { label: 'Zitat', icon: 'fa-quote-right', aktion: () => this.zeilenPraefix(() => '> ', /^> /) },
    ],
    [
      { label: 'Code', icon: 'fa-code', aktion: () => this.umschliessen('`') },
      { label: 'Link', icon: 'fa-link', aktion: () => this.link() },
    ],
  ];

  tooltip(f: Format): string {
    return f.taste ? `${f.label} (Strg+${f.taste})` : f.label;
  }

  onInput(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }

  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
      const kuerzel: Record<string, () => void> = {
        b: () => this.umschliessen('**'),
        i: () => this.umschliessen('*'),
        u: () => this.umschliessen('<u>', '</u>'),
      };
      const aktion = kuerzel[event.key.toLowerCase()];
      if (aktion) {
        event.preventDefault();
        aktion();
      }
    } else if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      this.listeFortsetzen(event);
    }
  }

  /** Markiert den Text mit `vorne`/`hinten` – oder entfernt die Markierung, wenn sie schon da ist. */
  private umschliessen(vorne: string, hinten = vorne): void {
    const ta = this.textarea().nativeElement;
    const { selectionStart: s, selectionEnd: e, value: v } = ta;
    const auswahl = v.slice(s, e);

    if (v.slice(s - vorne.length, s) === vorne && v.slice(e, e + hinten.length) === hinten) {
      this.ersetzen(s - vorne.length, e + hinten.length, auswahl, s - vorne.length, e - vorne.length);
    } else if (auswahl.length >= vorne.length + hinten.length && auswahl.startsWith(vorne) && auswahl.endsWith(hinten)) {
      const innen = auswahl.slice(vorne.length, auswahl.length - hinten.length);
      this.ersetzen(s, e, innen, s, s + innen.length);
    } else {
      // Leerzeichen am Rand der Auswahl (Doppelklick auf ein Wort) außerhalb der Markierung lassen
      const innen = auswahl.trim();
      const start = s + auswahl.indexOf(innen);
      const ende = start + innen.length;
      this.ersetzen(start, ende, vorne + innen + hinten, start + vorne.length, ende + vorne.length);
    }
  }

  /** Setzt vor jede ausgewählte Zeile ein Präfix (Liste, Überschrift …) bzw. entfernt es wieder. */
  private zeilenPraefix(praefix: (index: number) => string, muster: RegExp): void {
    const ta = this.textarea().nativeElement;
    const v = ta.value;
    const start = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
    let ende = v.indexOf('\n', ta.selectionEnd - (ta.selectionEnd > ta.selectionStart ? 1 : 0));
    if (ende < 0) {
      ende = v.length;
    }
    const zeilen = v.slice(start, ende).split('\n');
    const entfernen = zeilen.every((z) => muster.test(z));
    const neu = zeilen
      .map((z, i) => (entfernen ? z.replace(muster, '') : praefix(i) + z.replace(/^(#+ |[-*] |\d+\. |> )/, '')))
      .join('\n');
    this.ersetzen(start, ende, neu, start, start + neu.length);
  }

  private link(): void {
    const ta = this.textarea().nativeElement;
    const { selectionStart: s, selectionEnd: e, value: v } = ta;
    const text = v.slice(s, e) || 'Linktext';
    const neu = `[${text}](https://)`;
    // Cursor auf die Adresse setzen, damit man sie direkt eintippen kann
    const adresse = s + text.length + 3;
    this.ersetzen(s, e, neu, adresse, adresse + 'https://'.length);
  }

  /** Enter in einer Listenzeile: nächsten Punkt anlegen; in einem leeren Punkt: Liste beenden. */
  private listeFortsetzen(event: KeyboardEvent): void {
    const ta = this.textarea().nativeElement;
    const { selectionStart: s, selectionEnd: e, value: v } = ta;
    if (s !== e) {
      return;
    }
    const zeilenStart = v.lastIndexOf('\n', s - 1) + 1;
    const zeile = v.slice(zeilenStart, s);
    const treffer = /^(\s*)([-*]|\d+\.|>) /.exec(zeile);
    if (!treffer) {
      return;
    }
    event.preventDefault();
    if (zeile.trim() === treffer[2]) {
      this.ersetzen(zeilenStart, s, '', zeilenStart, zeilenStart);
      return;
    }
    const nummer = /^\d+/.exec(treffer[2]);
    const naechstes = nummer ? `${Number(nummer[0]) + 1}.` : treffer[2];
    const einfuegen = `\n${treffer[1]}${naechstes} `;
    this.ersetzen(s, s, einfuegen, s + einfuegen.length, s + einfuegen.length);
  }

  /**
   * Ersetzt einen Textbereich und setzt danach die Auswahl. `execCommand` erhält den Rückgängig-Verlauf
   * (Strg+Z) des Browsers; fällt es weg, wird der Text direkt gesetzt.
   */
  private ersetzen(von: number, bis: number, text: string, auswahlStart: number, auswahlEnde: number): void {
    const ta = this.textarea().nativeElement;
    ta.focus();
    ta.setSelectionRange(von, bis);
    if (!document.execCommand?.('insertText', false, text)) {
      ta.setRangeText(text, von, bis, 'end');
    }
    ta.setSelectionRange(auswahlStart, auswahlEnde);
    this.value.set(ta.value);
  }
}
