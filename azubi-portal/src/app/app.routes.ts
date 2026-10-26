import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth-guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';
import { Role } from './core/models';
import { Login } from './pages/login/login';
import { KeinZugriff } from './pages/kein-zugriff/kein-zugriff';
import { LoginLayout } from './layout/login-layout/login-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { BerichtsheftWoche } from './pages/berichtsheft/berichtsheft-woche/berichtsheft-woche';
import { BerichtsheftHistorie } from './pages/berichtsheft/berichtsheft-historie/berichtsheft-historie';
import { BerichtsheftPruefung } from './pages/berichtsheft/berichtsheft-pruefung/berichtsheft-pruefung';
import { BerichtsheftAzubis } from './pages/berichtsheft/berichtsheft-azubis/berichtsheft-azubis';
import { PersonLernzieleView } from './pages/personenLernziele/person-lernziele-view/person-lernziele-view';
import { PersonAnlegen } from './pages/personen/person-anlegen/person-anlegen';
import { PersonBearbeiten } from './pages/personen/person-bearbeiten/person-bearbeiten';
import { LernzielAnlegen } from './pages/lernziele/lernziel-anlegen/lernziel-anlegen';
import { LernzielViewAll } from './pages/lernziele/lernziel-view-all/lernziel-view-all';
import { Profil } from './pages/profil/profil';
import { Organigramm } from './pages/organigramm/organigramm';
import { Aktualisieren } from './layout/aktualisieren/aktualisieren';

const STAFF: Role[] = ['ROLE_TRAINER'];
const LEARNER: Role[] = ['ROLE_TRAINEE', 'ROLE_STUDENT'];

export const routes: Routes = [
  { path: 'login', component: Login, title: 'Anmelden – Azubi Portal' },
  { path: 'kein-zugriff', component: KeinZugriff, title: 'Kein Zugriff – Azubi Portal' },
  {
    // Seiten mit Header & Sidebar (nur angemeldet)
    path: '',
    component: LoginLayout,
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Dashboard, title: 'Übersicht – Azubi Portal' },

      // Berichtsheft
      {
        path: 'berichtsheft',
        component: BerichtsheftWoche,
        canDeactivate: [unsavedChangesGuard],
        data: { roles: LEARNER },
        title: 'Berichtsheft',
      },
      { path: 'berichtsheft/historie', component: BerichtsheftHistorie, data: { roles: LEARNER }, title: 'Meine Wochen' },
      { path: 'berichtsheft/pruefung', component: BerichtsheftPruefung, data: { roles: STAFF }, title: 'Berichtshefte prüfen' },
      { path: 'berichtsheft/azubis', component: BerichtsheftAzubis, data: { roles: STAFF }, title: 'Berichtshefte' },
      { path: 'berichtsheft/azubis/:personId', component: BerichtsheftWoche, data: { roles: STAFF }, title: 'Berichtsheft' },

      // Lernfortschritt
      { path: 'personen-lernziele-view', component: PersonLernzieleView, title: 'Lernfortschritt' },

      // Personen
      { path: 'person-anlegen', component: PersonAnlegen, data: { roles: STAFF }, title: 'Person anlegen' },
      { path: 'person-bearbeiten', component: PersonBearbeiten, data: { roles: STAFF }, title: 'Personen verwalten' },

      // Lernziele
      { path: 'lernziel-view-all', component: LernzielViewAll, title: 'Lernziele' },
      { path: 'lernziel-anlegen', component: LernzielAnlegen, data: { roles: STAFF }, title: 'Lernziel anlegen' },
      { path: 'lernziel-bearbeiten/:id', component: LernzielAnlegen, data: { roles: STAFF }, title: 'Lernziel bearbeiten' },
      { path: 'lernziel-loeschen', redirectTo: 'lernziel-view-all' },

      // Für alle sichtbar
      { path: 'organigramm', component: Organigramm, title: 'Ausbildungsorganigramm' },

      { path: 'profil', component: Profil, title: 'Mein Profil' },

      // Zwischenschritt, damit eine Seite beim Öffnen einer Benachrichtigung neu geladen wird
      { path: 'aktualisieren', component: Aktualisieren },
    ],
  },
  { path: '**', redirectTo: '' },
];
