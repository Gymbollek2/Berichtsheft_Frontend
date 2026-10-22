import { Pipe, PipeTransform } from '@angular/core';
import { Marked } from 'marked';
import TurndownService from 'turndown';

/**
 * Markdown-Parser für Berichtsheft-Texte.
 * - `breaks`: einfacher Zeilenumbruch bleibt ein Umbruch (wie bei bisherigen Einträgen ohne Markdown).
 * - HTML im Text (z. B. `<u>` für Unterstreichen) wird von Angulars Sanitizer bei `[innerHTML]` bereinigt.
 */
const parser = new Marked({ gfm: true, breaks: true });

/** Wandelt Markdown in HTML um – Ergebnis nur über `[innerHTML]` ausgeben (bereinigt Skripte usw.). */
export function markdownZuHtml(text: string | null | undefined): string {
  if (!text?.trim()) {
    return '';
  }
  return parser.parse(text, { async: false });
}

/**
 * Gegenstück zum Parser: HTML aus der bearbeitbaren Vorschau zurück in Markdown. Erzeugt dieselbe
 * Schreibweise wie die Formatierungsleiste (**fett**, *kursiv*, - Aufzählung, ### Überschrift …).
 */
const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
  codeBlockStyle: 'fenced',
  // <br> wird zu einem einfachen Zeilenumbruch – der Parser macht wegen `breaks` wieder <br> daraus
  br: '',
});
// Der Browser erzeugt beim Durchstreichen <strike> – das kennen die Typen nicht, daher Vergleich per Name
turndown.addRule('durchgestrichen', {
  filter: (knoten) => ['DEL', 'S', 'STRIKE'].includes(knoten.nodeName),
  replacement: (inhalt) => `~~${inhalt}~~`,
});
// Unterstreichen gibt es in Markdown nicht – wie in der Formatierungsleiste als <u>…</u>
turndown.addRule('unterstrichen', {
  filter: ['u'],
  replacement: (inhalt) => `<u>${inhalt}</u>`,
});
// Wie die Standardregel, aber mit einem Leerzeichen nach dem Listenzeichen („- Punkt“ statt „-   Punkt“)
turndown.addRule('listenpunkt', {
  filter: 'li',
  replacement: (inhalt, knoten, optionen) => {
    const liste = knoten.parentNode as HTMLElement;
    let praefix = `${optionen.bulletListMarker} `;
    if (liste.nodeName === 'OL') {
      const start = Number(liste.getAttribute('start')) || 1;
      praefix = `${start + Array.prototype.indexOf.call(liste.children, knoten)}. `;
    }
    const text = inhalt
      .replace(/^\n+/, '')
      .replace(/\n+$/, '\n')
      .replace(/\n/gm, `\n${' '.repeat(praefix.length)}`);
    return praefix + text + (knoten.nextSibling && !text.endsWith('\n') ? '\n' : '');
  },
});

export function htmlZuMarkdown(html: string): string {
  return turndown.turndown(html).replace(/\xa0/g, ' ').trim();
}

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(text: string | null | undefined): string {
    return markdownZuHtml(text);
  }
}
