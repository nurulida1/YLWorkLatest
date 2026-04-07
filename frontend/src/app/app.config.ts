import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import MyPreset from '../themes/mypreset';
import { AuthInterceptorFn } from './common/interceptor/auth.interceptor';
import { CsrfInterceptorFn } from './common/interceptor/csrf.interceptor';
import { ErrorInterceptorFn } from './common/interceptor/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        CsrfInterceptorFn,
        AuthInterceptorFn,
        ErrorInterceptorFn,
      ]),
    ),
    ConfirmationService,
    MessageService,
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          prefix: 'p',
          darkModeSelector: 'darkMode',
        },
      },
    }),
  ],
};
