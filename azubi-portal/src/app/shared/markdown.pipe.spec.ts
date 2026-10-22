import { markdownZuHtml } from './markdown.pipe';

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
