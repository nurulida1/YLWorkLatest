import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { map, catchError, of } from 'rxjs';

import { PermissionService } from '../services/permissionService';

type PermissionAction =
  | 'canRead'
  | 'canCreate'
  | 'canUpdate'
  | 'canDelete'
  | 'canUpdateStatus';

export const permissionGuard = (
  moduleKey: string,

  actions: PermissionAction | PermissionAction[] = 'canRead',
): CanActivateFn => {
  return () => {
    const permissionService = inject(PermissionService);

    const router = inject(Router);

    const user = permissionService.currentUser;

    if (user?.systemRole === 'SuperAdmin') {
      return true;
    }

    const needsLoad = permissionService.matrix().length === 0;

    const load$ = needsLoad ? permissionService.loadPermissions() : of([]);

    return load$.pipe(
      map(() => {
        const rights = permissionService.getModuleRights(moduleKey)();

        const actionList = Array.isArray(actions) ? actions : [actions];

        const allowed = actionList.some((action) => rights?.[action]);

        return allowed ? true : router.createUrlTree(['/unauthorized']);
      }),

      catchError((error) => {
        console.error(error);

        return of(router.createUrlTree(['/unauthorized']));
      }),
    );
  };
};
