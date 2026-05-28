import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { PermissionService } from '../services/permissionService';

export const permissionGuard = (
  moduleKey: string,
  action: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete' = 'canRead',
): CanActivateFn => {
  return () => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    const user = permissionService['userService'].currentUser;
    console.log(user);
    if (user?.systemRole === 'SuperAdmin') {
      return true;
    }

    const needsLoad = permissionService.matrix().length === 0;
    const load$ = needsLoad
      ? (permissionService.loadPermissions() ?? of([]))
      : of([]);

    return load$.pipe(
      map(() => {
        const rights = permissionService.getModuleRights(moduleKey)();
        console.log(rights);
        const allowed = rights?.[action] ?? false;

        return allowed ? true : router.createUrlTree(['/unauthorized']);
      }),
      catchError(() => of(router.createUrlTree(['/unauthorized']))),
    );
  };
};
