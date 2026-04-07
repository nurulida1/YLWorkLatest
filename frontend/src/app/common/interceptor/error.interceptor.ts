import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MessageService } from 'primeng/api';
import { LoadingService } from '../../services/loading.service';

export function ErrorInterceptorFn(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const message = inject(MessageService);
  const loadingService = inject(LoadingService);

  return next(req).pipe(catchError((error) => errorHandler(error)));

  function errorHandler(response: HttpEvent<any>): Observable<HttpEvent<any>> {
    if (response instanceof HttpErrorResponse) {
      switch (response.status) {
        case 400:
          message.add({
            severity: 'error',
            summary: response.status.toString(),
            detail: 'Bad Request',
          });
          loadingService.stop();
          break;
        case 401:
          message.add({
            severity: 'error',
            summary: response.status.toString(),
            detail: 'Unauthorized',
          });
          loadingService.stop();
          break;
        case 403:
          message.add({
            severity: 'error',
            summary: response.status.toString(),
            detail: 'No Permission',
          });
          loadingService.stop();
          break;
        case 404:
          message.add({
            severity: 'error',
            summary: response.status.toString(),
            detail: 'Not Found',
          });
          loadingService.stop();
          break;
        case 409:
          message.add({
            severity: 'error',
            summary: response.status.toString(),
            detail: 'Conflict',
          });
          loadingService.stop();
          break;
        case 500:
          message.add({
            severity: 'error',
            summary: response.status.toString(),
            detail: 'Server Error',
          });
          loadingService.stop();
          break;
        case 503:
          message.add({
            severity: 'error',
            summary: response.status.toString(),
            detail: `Service Unavailable`,
          });
          loadingService.stop();
          break;
        case 0:
          message.add({
            severity: 'error',
            summary: response.status.toString(),
            detail: `No Connection`,
          });
          loadingService.stop();
          break;

        default:
          message.add({
            severity: 'error',
            summary: `${response.status.toString()}, detail: ${
              response.message
            }`,
          });
          loadingService.stop();
          break;
      }
    }
    throw response;
  }
}
