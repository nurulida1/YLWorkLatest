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
      if (isLeaveValidationResponse(response)) {
        loadingService.stop();
        throw response;
      }

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

  /** Leave submit returns business validation in body; component shows the specific toast. */
  function isLeaveValidationResponse(response: HttpErrorResponse): boolean {
    const body = parseErrorBody(response.error);
    if (!body) return false;
    if (body['balanceSufficient'] === false || body['BalanceSufficient'] === false) return true;
    if (body['conflictWarning'] || body['ConflictWarning']) return true;
    const remaining = body['remainingBalance'] ?? body['RemainingBalance'];
    const requestId = body['requestId'] ?? body['RequestId'];
    const emptyRequestId =
      !requestId || requestId === '00000000-0000-0000-0000-000000000000';
    if (remaining != null && emptyRequestId) return true;
    return false;
  }

  function parseErrorBody(error: unknown): Record<string, unknown> | null {
    if (!error) return null;
    if (typeof error === 'object' && !Array.isArray(error)) {
      return error as Record<string, unknown>;
    }
    if (typeof error === 'string') {
      try {
        const parsed = JSON.parse(error);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}
