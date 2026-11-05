import { inject } from '@angular/core';
import { Router, CanMatchFn } from '@angular/router';
import { AuthService } from '../../services/authService';

export const deviceRedirectGuard: CanMatchFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (isMobile) {
    return router.parseUrl('/splash-screen');
  }

  return router.parseUrl(
    authService.isAuthenticated() ? '/dashboard' : '/login',
  );
};
