import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from '@app/services/auth';

/** Anfragen zur Anmeldung selbst – ohne Token, und ein 401 bedeutet dort nicht „Sitzung abgelaufen“. */
const ANMELDUNG = ['/v1/passport/login', '/v1/passport/sso', '/v1/passport/optionen'];

/** Hängt das JWT an jede API-Anfrage und meldet bei abgelaufener Sitzung (401) ab. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.getToken();
  const isLogin = ANMELDUNG.some((pfad) => req.url.endsWith(pfad));

  const request =
    token && !isLogin ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isLogin) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
