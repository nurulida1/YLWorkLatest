import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanMatchFn } from '@angular/router';

export const deviceRedirectGuard: CanMatchFn = () => {
  const router = inject(Router);

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (isMobile) {
    router.navigate(['/splash-screen']);
  } else {
    router.navigate(['/dashboard']);
  }

  return false;
};
