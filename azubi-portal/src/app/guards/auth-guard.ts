import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@app/services/auth';
import { Role } from '@app/core/models';

/** Lässt nur angemeldete Benutzer durch. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  return auth.isLoggedIn() ? true : inject(Router).parseUrl('/login');
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
