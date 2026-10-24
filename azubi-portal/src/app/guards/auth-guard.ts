import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@app/services/auth';
import { Role } from '@app/core/models';

/**
 * Lässt nur angemeldete Benutzer durch. Die aufgerufene Seite (z. B. aus dem Button einer E-Mail) wird als
 * „ziel“ an den Login übergeben, damit es nach der Anmeldung dort weitergeht.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  if (auth.isLoggedIn()) {
    return true;
  }
  const ziel = state.url && state.url !== '/' ? { ziel: state.url } : undefined;
  return inject(Router).createUrlTree(['/login'], { queryParams: ziel });
};

/** Prüft die Rollen aus der Routen-Konfiguration: { data: { roles: [...] } }. */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const roles = (route.data?.['roles'] as Role[] | undefined) ?? [];
  if (roles.length === 0 || auth.hasAnyRole(roles)) {
    return true;
  }
  return inject(Router).parseUrl('/dashboard');
};
