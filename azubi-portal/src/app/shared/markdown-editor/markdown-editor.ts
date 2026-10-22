import {
  Component,
  ElementRef,
  SecurityContext,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MarkdownPipe, htmlZuMarkdown, markdownZuHtml } from '../markdown.pipe';

interface Format {
  label: string;
  icon: string;
  /** Tastenkürzel (mit Strg bzw. ⌘), nur zur Anzeige im Tooltip. */
  taste?: string;
  /** Im Modus „Schreiben“: setzt Markdown-Zeichen in die Texteingabe. */
  aktion: () => void;
  /** Im Modus „Vorschau“: formatiert den sichtbaren Text direkt. */
  vorschau: () => void;
}

/**
 * Texteingabe mit Formatierungsleiste. Gespeichert wird reiner Markdown-Text – man kann also
 * die Buttons nutzen oder Markdown direkt tippen (z. B. **fett**, *kursiv*, - Liste).
 * Unterstreichen gibt es in Markdown nicht, dafür wird `<u>…</u>` eingefügt.
 *
 * Die Vorschau ist ebenfalls bearbeitbar: Dort formatiert die Leiste den Text wie in einer
 * Textverarbeitung, und jede Änderung wird sofort wieder in Markdown umgewandelt.
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
  private readonly vorschauFeld = viewChild<ElementRef<HTMLDivElement>>('vorschauFeld');
  private readonly sanitizer = inject(DomSanitizer);

  readonly formate: Format[][] = [
    [
      {
        label: 'Fett',
        icon: 'fa-bold',
        taste: 'B',
        aktion: () => this.umschliessen('**'),
        vorschau: () => this.befehl('bold'),
      },
      {
        label: 'Kursiv',
        icon: 'fa-italic',
        taste: 'I',
        aktion: () => this.umschliessen('*'),
        vorschau: () => this.befehl('italic'),
      },
      {
        label: 'Unterstrichen',
        icon: 'fa-underline',
        taste: 'U',
        aktion: () => this.umschliessen('<u>', '</u>'),
        vorschau: () => this.befehl('underline'),
      },
      {
        label: 'Durchgestrichen',
        icon: 'fa-strikethrough',
        aktion: () => this.umschliessen('~~'),
        vorschau: () => this.befehl('strikeThrough'),
      },
    ],
    [
      {
        label: 'Überschrift',
        icon: 'fa-heading',
        aktion: () => this.zeilenPraefix(() => '### ', /^#+ /),
        vorschau: () => this.block('h3'),
      },
      {
        label: 'Aufzählung',
        icon: 'fa-list-ul',
        aktion: () => this.zeilenPraefix(() => '- ', /^[-*] /),
        vorschau: () => this.befehl('insertUnorderedList'),
      },
      {
        label: 'Nummerierte Liste',
        icon: 'fa-list-ol',
        aktion: () => this.zeilenPraefix((i) => `${i + 1}. `, /^\d+\. /),
        vorschau: () => this.befehl('insertOrderedList'),
      },
      {
        label: 'Zitat',
        icon: 'fa-quote-right',
        aktion: () => this.zeilenPraefix(() => '> ', /^> /),
        vorschau: () => this.block('blockquote'),
      },
    ],
    [
      {
        label: 'Code',
        icon: 'fa-code',
        aktion: () => this.umschliessen('`'),
        vorschau: () => this.codeVorschau(),
      },
      {
        label: 'Link',
        icon: 'fa-link',
        aktion: () => this.link(),
        vorschau: () => this.linkVorschau(),
      },
    ],
  ];

  constructor() {
    // Beim Wechsel in die Vorschau den Text einmal als HTML einsetzen. Danach führt das Feld selbst:
    // Ein Neusetzen bei jeder Eingabe würde den Cursor an den Anfang springen lassen.
    effect(() => {
      const feld = this.vorschauFeld()?.nativeElement;
      if (feld) {
        const html = markdownZuHtml(untracked(this.value));
        feld.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
      }
    });
  }

  formatieren(f: Format): void {
    if (this.vorschau()) {
      f.vorschau();
    } else {
      f.aktion();
    }
  }

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
      this.ersetzen(
        s - vorne.length,
        e + hinten.length,
        auswahl,
        s - vorne.length,
        e - vorne.length,
      );
    } else if (
      auswahl.length >= vorne.length + hinten.length &&
      auswahl.startsWith(vorne) &&
      auswahl.endsWith(hinten)
    ) {
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
      .map((z, i) =>
        entfernen ? z.replace(muster, '') : praefix(i) + z.replace(/^(#+ |[-*] |\d+\. |> )/, ''),
      )
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

  /** Änderung in der Vorschau als Markdown übernehmen. */
  vorschauUebernehmen(): void {
    const feld = this.vorschauFeld()?.nativeElement;
    if (feld) {
      this.value.set(htmlZuMarkdown(feld.innerHTML));
    }
  }

  /** Neue Zeilen per Enter als Absatz anlegen (sonst erzeugt Chrome <div>). */
  vorschauFokus(): void {
    document.execCommand('defaultParagraphSeparator', false, 'p');
  }

  /** Eingefügter Text kommt ohne fremde Formatierung (Word, Webseiten …) – formatiert wird mit der Leiste. */
  einfuegenAlsText(event: ClipboardEvent): void {
    event.preventDefault();
    document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? '');
  }

  /**
   * Formatiert in der Vorschau über die Bearbeitungsbefehle des Browsers – sie wirken auf die Auswahl,
   * schalten wieder aus (z. B. zweimal „Fett“) und lassen sich mit Strg+Z rückgängig machen.
   */
  private befehl(name: string, wert?: string): void {
    const feld = this.vorschauFeld()?.nativeElement;
    if (!feld) {
      return;
    }
    feld.focus();
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(name, false, wert);
    this.vorschauUebernehmen();
  }

  /** Überschrift bzw. Zitat für den aktuellen Absatz – ist es schon eins, wird es wieder ein normaler Absatz. */
  private block(tag: 'h3' | 'blockquote'): void {
    const aktuell = String(document.queryCommandValue('formatBlock')).toLowerCase();
    this.befehl('formatBlock', aktuell === tag ? '<p>' : `<${tag}>`);
  }

  private codeVorschau(): void {
    const feld = this.vorschauFeld()?.nativeElement;
    const auswahl = window.getSelection();
    if (!feld || !auswahl?.rangeCount || !feld.contains(auswahl.anchorNode)) {
      return;
    }
    // Direkt im DOM statt per insertHTML: Chrome macht aus eingefügtem <code> sonst ein <span> mit Inline-Stilen
    const element =
      auswahl.anchorNode instanceof Element
        ? auswahl.anchorNode
        : auswahl.anchorNode?.parentElement;
    const vorhanden = element?.closest('code');
    if (vorhanden && feld.contains(vorhanden)) {
      // Schon Code: wieder normaler Text
      const text = document.createTextNode(vorhanden.textContent ?? '');
      vorhanden.replaceWith(text);
      const range = document.createRange();
      range.selectNode(text);
      auswahl.removeAllRanges();
      auswahl.addRange(range);
    } else if (!auswahl.isCollapsed) {
      const range = auswahl.getRangeAt(0);
      const code = document.createElement('code');
      code.textContent = range.toString();
      range.deleteContents();
      range.insertNode(code);
      auswahl.selectAllChildren(code);
    } else {
      return;
    }
    this.vorschauUebernehmen();
  }

  private linkVorschau(): void {
    const feld = this.vorschauFeld()?.nativeElement;
    const auswahl = window.getSelection();
    if (!feld || !auswahl?.rangeCount || !feld.contains(auswahl.anchorNode)) {
      return;
    }
    // Der Dialog nimmt dem Feld die Auswahl – danach wiederherstellen
    const markiert = auswahl.getRangeAt(0).cloneRange();
    const adresse = window.prompt('Adresse des Links', 'https://')?.trim();
    if (!adresse) {
      return;
    }
    feld.focus();
    auswahl.removeAllRanges();
    auswahl.addRange(markiert);
    if (markiert.collapsed) {
      const text = adresse.replace(/[&<>"]/g, (z) => `&#${z.charCodeAt(0)};`);
      this.befehl('insertHTML', `<a href="${text}">${text}</a>`);
    } else {
      this.befehl('createLink', adresse);
    }
  }

  /**
   * Ersetzt einen Textbereich und setzt danach die Auswahl. `execCommand` erhält den Rückgängig-Verlauf
   * (Strg+Z) des Browsers; fällt es weg, wird der Text direkt gesetzt.
   */
  private ersetzen(
    von: number,
    bis: number,
    text: string,
    auswahlStart: number,
    auswahlEnde: number,
  ): void {
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
