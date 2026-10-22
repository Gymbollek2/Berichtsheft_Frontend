import { zeitRelativ } from './utils';

describe('Zeitangabe in Benachrichtigungen', () => {
  const jetzt = new Date(2026, 9, 22, 15, 30);

  it('zeigt kurze Abstände relativ an', () => {
    expect(zeitRelativ('2026-10-22T15:29:40', jetzt)).toBe('gerade eben');
    expect(zeitRelativ('2026-10-22T15:25:00', jetzt)).toBe('vor 5 Min.');
    expect(zeitRelativ('2026-10-22T12:10:00', jetzt)).toBe('vor 3 Std.');
  });

  it('zeigt ältere Nachrichten mit Datum an', () => {
    expect(zeitRelativ('2026-10-21T09:05:00', jetzt)).toBe('gestern, 09:05');
    expect(zeitRelativ('2026-10-12T17:45:00', jetzt)).toBe('12.10., 17:45');
    expect(zeitRelativ('2025-12-30T08:00:00', jetzt)).toBe('30.12.2025');
  });
});
