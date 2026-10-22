import { Pipe, PipeTransform } from '@angular/core';
import { Marked } from 'marked';

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

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(text: string | null | undefined): string {
    return markdownZuHtml(text);
  }
}
