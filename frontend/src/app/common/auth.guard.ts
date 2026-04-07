import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/authService';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // ✅ Check if user is authenticated
  if (authService.isAuthenticated()) {
    return true; // allow access
  }

  // ❌ Not authenticated → redirect to login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }, // <-- here
  });

  return false; // block route
};
