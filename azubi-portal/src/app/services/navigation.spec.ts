import { NavigationService } from './navigation';

describe('NavigationService', () => {
  const service = new NavigationService();

  it('zeigt Azubis keine Personenverwaltung', () => {
    const keys = service.sectionsFor('ROLE_TRAINEE').map((s) => s.key);
    expect(keys).not.toContain('personen');
    expect(keys).toContain('berichtsheft');
  });

  it('zeigt Ausbildern die Prüfung, aber nicht "Meine Woche"', () => {
    const berichtsheft = service.sectionsFor('ROLE_TRAINER').find((s) => s.key === 'berichtsheft')!;
    const routes = berichtsheft.links.map((l) => l.route);
    expect(routes).toContain('/berichtsheft/pruefung');
    expect(routes).not.toContain('/berichtsheft');
  });

  it('ordnet Unterseiten dem richtigen Bereich zu', () => {
    const sections = service.sectionsFor('ROLE_TRAINEE');
    expect(service.sectionForUrl('/berichtsheft/historie', sections)?.key).toBe('berichtsheft');
    expect(service.sectionForUrl('/lernziel-view-all?x=1', sections)?.key).toBe('lernziele');
  });

  it('liefert für unbekannte Rollen nichts', () => {
    expect(service.sectionsFor(null)).toEqual([]);
  });
});
