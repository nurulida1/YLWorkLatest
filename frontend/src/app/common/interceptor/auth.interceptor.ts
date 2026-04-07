import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export function AuthInterceptorFn(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const router = inject(Router);

  // ✅ Get token from localStorage
  const token =
    localStorage.getItem('jwtToken') ?? sessionStorage.getItem('jwtToken');

  // ✅ Clone request and attach Authorization header if token exists
  const clonedReq = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : req;

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Optional: clear invalid token
        localStorage.removeItem('jwtToken');
        sessionStorage.removeItem('jwtToken');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}
