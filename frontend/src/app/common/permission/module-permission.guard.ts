import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { map, switchMap, catchError, of } from 'rxjs';
import { PermissionService } from '../../services/permissionService';
import { PermissionContextService } from '../../services/permission-context.service';
import { ModuleRegistryService } from '../../services/module-registry.service';
import {
  inferPermissionActions,
  hasAnyAction,
} from './permission-action.util';
import { PermissionAction } from './permission.types';

/** Deepest moduleKey in the activated route tree (after lazy routes are merged). */
function findModuleKeyInRouteTree(
  root: ActivatedRouteSnapshot,
): string | null {
  let found: string | null = null;

  const visit = (node: ActivatedRouteSnapshot): void => {
    const key = node.data['moduleKey'] as string | undefined;
    if (key) {
      found = key;
    }
    for (const child of node.children) {
      visit(child);
    }
  };

  visit(root);
  return found;
}

function resolveModuleKey(
  route: ActivatedRouteSnapshot,
  url: string,
  registry: ModuleRegistryService,
): string | null {
  const fromTree = findModuleKeyInRouteTree(route.root);
  if (fromTree) {
    return fromTree;
  }

  let current: ActivatedRouteSnapshot | null = route;
  while (current) {
    const fromData = current.data['moduleKey'] as string | undefined;
    if (fromData) {
      return fromData;
    }
    current = current.parent;
  }

  return registry.resolveModuleCodeFromUrl(url);
}

/** Lazy loadChildren wrapper runs before child route config exists; defer to URL resolution or child activation. */
function isLazyLoadBoundary(route: ActivatedRouteSnapshot): boolean {
  return !!route.routeConfig?.loadChildren && !route.data['moduleKey'];
}

function resolveActions(
  route: ActivatedRouteSnapshot,
  url: string,
): PermissionAction[] {
  const fromData = route.data['permissionActions'] as
    | PermissionAction
    | PermissionAction[]
    | undefined;

  if (fromData) {
    return Array.isArray(fromData) ? fromData : [fromData];
  }

  let current: ActivatedRouteSnapshot | null = route.parent;
  while (current) {
    const parentActions = current.data['permissionActions'] as
      | PermissionAction
      | PermissionAction[]
      | undefined;
    if (parentActions) {
      return Array.isArray(parentActions) ? parentActions : [parentActions];
    }
    current = current.parent;
  }

  return inferPermissionActions(url);
}

export const modulePermissionGuard: CanActivateFn = (route, state) => {
  const registry = inject(ModuleRegistryService);
  const permissionService = inject(PermissionService);
  const context = inject(PermissionContextService);
  const router = inject(Router);

  return registry.ensureLoaded().pipe(
    switchMap(() => {
      const moduleKey = resolveModuleKey(route, state.url, registry);

      if (!moduleKey && isLazyLoadBoundary(route)) {
        return of(true);
      }

      if (!moduleKey) {
        console.warn('No system module registered for URL:', state.url);
        return of(router.createUrlTree(['/unauthorized']));
      }

      const actions = resolveActions(route, state.url);
      context.setModuleKey(moduleKey);

      const user = permissionService.currentUser;
      if (user?.systemRole === 'SuperAdmin') {
        return of(true);
      }

      const needsLoad = permissionService.matrix().length === 0;
      const load$ = needsLoad ? permissionService.loadPermissions() : of([]);

      return load$.pipe(
        map(() => {
          const rights = permissionService.getModuleRights(moduleKey)();
          const allowed = hasAnyAction(rights, actions);
          return allowed ? true : router.createUrlTree(['/unauthorized']);
        }),
        catchError((err) => {
          console.error('Module permission guard failed', err);
          return of(router.createUrlTree(['/unauthorized']));
        }),
      );
    }),
  );
};
