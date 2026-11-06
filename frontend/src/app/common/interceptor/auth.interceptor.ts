import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../../services/authService';

export function AuthInterceptorFn(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Do not attempt token refresh for authentication endpoints.
  const url = req.url.toLowerCase();

  const isAuthEndpoint =
    url.includes('/auth/authenticate') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout');

  // Get access token from either storage.
  const token =
    localStorage.getItem('jwtToken') ?? sessionStorage.getItem('jwtToken');

  // Attach access token.
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 403 - Forbidden: User does not have permission.
      if (error.status === 403) {
        if (router.url !== '/unauthorized') {
          router.navigate(['/unauthorized']);
        }

        return throwError(() => error);
      }

      // Only handle 401 Unauthorized.
      // Do not refresh for authentication endpoints.
      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      // Attempt to refresh the access token.
      return authService.refreshAccessToken().pipe(
        switchMap((response) => {
          if (!response?.accessToken) {
            authService.clearAuth();

            router.navigate(['/login'], {
              queryParams: {
                returnUrl: router.url,
              },
            });

            return throwError(() => error);
          }

          // Retry original request using the new access token.
          const retryRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          });

          return next(retryRequest);
        }),

        catchError((refreshError) => {
          authService.clearAuth();

          router.navigate(['/login'], {
            queryParams: {
              returnUrl: router.url,
            },
          });

          return throwError(() => refreshError);
        }),
      );
    }),
  );
}
