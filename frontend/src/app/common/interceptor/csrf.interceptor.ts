import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export function CsrfInterceptorFn(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  var requestToken = getCookieValue('XSRF-TOKEN'); //XSRF-REQUEST-TOKEN
  return next(
    req.clone({
      headers: req.headers.set('X-XSRF-TOKEN', requestToken),
    })
  );

  function getCookieValue(cookieName: string) {
    const allCookies = decodeURIComponent(document.cookie).split('; ');
    for (let i = 0; i < allCookies.length; i++) {
      const cookie = allCookies[i];
      if (cookie.startsWith(cookieName + '=')) {
        return cookie.substring(cookieName.length + 1);
      }
    }
    return '';
  }
}
