import { htmlZuMarkdown, markdownZuHtml } from './markdown.pipe';

describe('Markdown im Berichtsheft', () => {
  it('formatiert fett, kursiv und unterstrichen', () => {
    const html = markdownZuHtml('**fett** *kursiv* <u>unter</u>');
    expect(html).toContain('<strong>fett</strong>');
    expect(html).toContain('<em>kursiv</em>');
    expect(html).toContain('<u>unter</u>');
  });

  it('erzeugt Listen', () => {
    expect(markdownZuHtml('- eins\n- zwei')).toContain('<li>eins</li>');
    expect(markdownZuHtml('1. eins\n2. zwei')).toContain('<ol>');
  });

  it('behält einfache Zeilenumbrüche bisheriger Einträge', () => {
    expect(markdownZuHtml('Zeile 1\nZeile 2')).toContain('<br>');
  });

  it('liefert für leeren Text nichts', () => {
    expect(markdownZuHtml(null)).toBe('');
    expect(markdownZuHtml('  ')).toBe('');
  });
});

describe('Bearbeitete Vorschau zurück in Markdown', () => {
  it('übernimmt Formatierungen aus der Vorschau-Leiste', () => {
    expect(
      htmlZuMarkdown(
        '<p><b>fett</b> <i>kursiv</i> <u>unter</u> <strike>weg</strike> <code>x</code></p>',
      ),
    ).toBe('**fett** *kursiv* <u>unter</u> ~~weg~~ `x`');
  });

  it('schreibt Listen, Überschriften und Zitate wie die Formatierungsleiste', () => {
    expect(htmlZuMarkdown('<ul><li>eins</li><li>zwei</li></ul>')).toBe('- eins\n- zwei');
    expect(htmlZuMarkdown('<ol><li>eins</li><li>zwei</li></ol>')).toBe('1. eins\n2. zwei');
    expect(htmlZuMarkdown('<h3>Titel</h3>')).toBe('### Titel');
    expect(htmlZuMarkdown('<blockquote><p>Zitat</p></blockquote>')).toBe('> Zitat');
    expect(htmlZuMarkdown('<p><a href="https://example.org">Link</a></p>')).toBe(
      '[Link](https://example.org)',
    );
  });

  it('bleibt beim Hin- und Zurückwandeln gleich', () => {
    const text =
      '### Montag\n\n**Datenbanken** und *SQL*\nZweite Zeile\n\n- eins\n- zwei\n\n1. a\n2. b\n\n> Hinweis';
    expect(htmlZuMarkdown(markdownZuHtml(text))).toBe(text);
  });

  it('macht aus geschützten Leerzeichen normale', () => {
    expect(htmlZuMarkdown('<p>a&nbsp;b</p>')).toBe('a b');
  });
});
