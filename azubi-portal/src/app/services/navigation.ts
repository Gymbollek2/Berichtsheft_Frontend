import { Injectable } from '@angular/core';
import { Role } from '@app/core/models';

export interface NavLink {
  label: string;
  route: string;
  icon: string;
  roles?: Role[];
}

export interface NavSection {
  key: string;
  label: string;
  icon: string;
  roles?: Role[];
  links: NavLink[];
}

const STAFF: Role[] = ['ROLE_TRAINER'];
const LEARNER: Role[] = ['ROLE_TRAINEE', 'ROLE_STUDENT'];

/**
 * Menüstruktur des Portals. Die Kopfzeile zeigt die Bereiche, die Seitenleiste die Links
 * des aktiven Bereichs – jeweils gefiltert nach der Rolle des angemeldeten Benutzers.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'dashboard',
    label: 'Übersicht',
    icon: 'fa-house',
    links: [{ label: 'Übersicht', route: '/dashboard', icon: 'fa-house' }],
  },
  {
    key: 'berichtsheft',
    label: 'Berichtsheft',
    icon: 'fa-book',
    links: [
      { label: 'Aktuelle Woche', route: '/berichtsheft', icon: 'fa-pen-to-square', roles: LEARNER },
      { label: 'Alle Wochen', route: '/berichtsheft/historie', icon: 'fa-clock-rotate-left', roles: LEARNER },
      { label: 'Zur Prüfung', route: '/berichtsheft/pruefung', icon: 'fa-stamp', roles: STAFF },
      { label: 'Alle Berichtshefte', route: '/berichtsheft/azubis', icon: 'fa-users-viewfinder', roles: STAFF },
    ],
  },
  {
    key: 'personen-lernziele',
    label: 'Lernfortschritt',
    icon: 'fa-chart-line',
    links: [
      { label: 'Meine Lernziele', route: '/personen-lernziele-view', icon: 'fa-list-check', roles: LEARNER },
      { label: 'Lernfortschritt Azubis', route: '/personen-lernziele-view', icon: 'fa-list-check', roles: STAFF },
    ],
  },
  {
    key: 'lernziele',
    label: 'Lernziele',
    icon: 'fa-bullseye',
    links: [
      { label: 'Alle Lernziele', route: '/lernziel-view-all', icon: 'fa-sitemap' },
      { label: 'Lernziel anlegen', route: '/lernziel-anlegen', icon: 'fa-plus', roles: STAFF },
    ],
  },
  {
    key: 'organigramm',
    label: 'Ausbildungsorganigramm',
    icon: 'fa-sitemap',
    links: [{ label: 'Ausbildungsorganigramm', route: '/organigramm', icon: 'fa-sitemap' }],
  },
  {
    key: 'personen',
    label: 'Personen',
    icon: 'fa-users',
    roles: STAFF,
    links: [
      { label: 'Alle Personen', route: '/person-bearbeiten', icon: 'fa-user-gear', roles: STAFF },
      { label: 'Person anlegen', route: '/person-anlegen', icon: 'fa-user-plus', roles: STAFF },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class NavigationService {
  /** Bereiche, die für die Rolle sichtbar sind (mit gefilterten Links). */
  sectionsFor(role: Role | null): NavSection[] {
    if (!role) {
      return [];
    }
    return NAV_SECTIONS.filter((s) => allowed(s.roles, role))
      .map((s) => ({ ...s, links: s.links.filter((l) => allowed(l.roles, role)) }))
      .filter((s) => s.links.length > 0);
  }

  /** Ermittelt den Bereich zur aktuellen URL (längster passender Link gewinnt). */
  sectionForUrl(url: string, sections: NavSection[]): NavSection | null {
    const path = url.split('?')[0].split('#')[0];
    let best: { section: NavSection; length: number } | null = null;
    for (const section of sections) {
      for (const link of section.links) {
        if (path === link.route || path.startsWith(link.route + '/')) {
          if (!best || link.route.length > best.length) {
            best = { section, length: link.route.length };
          }
        }
      }
    }
    if (!best && path.startsWith('/lernziel-bearbeiten')) {
      return sections.find((s) => s.key === 'lernziele') ?? null;
    }
    return best?.section ?? null;
  }
}

function allowed(roles: Role[] | undefined, role: Role): boolean {
  return !roles || roles.includes(role);
}
