import {
  Injectable,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';

import { Observable, of } from 'rxjs';

import { UserService } from './userService.service';
import { ModuleRights, RolePermissionDto } from '../models/RolePermission';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _matrix = signal<RolePermissionDto[]>([]);
  private permissionsRequestUserId: string | null = null;
  readonly matrix = this._matrix.asReadonly();

  private cachedUserId: string | null = null;
  private permissionsLoadedForUserId: string | null = null;

  private permissionsRequest$: Observable<RolePermissionDto[]> | null = null;

  private requestVersion = 0;

  // Restore your original endpoint here.
  private readonly permissionUrl = `${environment.ApiBaseUrl}/RolePermission/by-matrix`;

  constructor() {
    this.userService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        const userId = user?.userId ?? null;

        if (this.cachedUserId !== userId) {
          this.cachedUserId = userId;
          this.clearPermissions();
        }
      });
  }

  get currentUser() {
    return this.userService.currentUser;
  }

  /**
   * Clear cached permissions and invalidate pending requests.
   */
  clearPermissions(): void {
    this.requestVersion++;

    this._matrix.set([]);
    this.permissionsLoadedForUserId = null;

    this.permissionsRequest$ = null;
    this.permissionsRequestUserId = null;
  }

  /**
   * Backward-compatible alias.
   */
  clearCache(): void {
    this.clearPermissions();
  }

  /**
   * Load permissions once per authenticated user.
   * Subsequent calls reuse the cached result.
   */

  loadPermissions(forceRefresh = false): Observable<RolePermissionDto[]> {
    const user = this.currentUser;

    if (!user?.userId) {
      this.clearPermissions();
      return of([]);
    }

    const userId = user.userId;

    // Return cached permissions.
    if (!forceRefresh && this.permissionsLoadedForUserId === userId) {
      return of(this._matrix());
    }

    // Share an existing request for this user.
    if (
      !forceRefresh &&
      this.permissionsRequest$ &&
      this.permissionsRequestUserId === userId
    ) {
      return this.permissionsRequest$;
    }

    const version = ++this.requestVersion;

    let params = new HttpParams().set('systemRole', user.systemRole ?? '');

    if (user.departmentIds?.length) {
      params = params.set('departmentIds', user.departmentIds.join(','));
    }

    const request$ = this.http
      .get<RolePermissionDto[]>(this.permissionUrl, { params })
      .pipe(
        tap((result) => {
          if (
            version !== this.requestVersion ||
            this.currentUser?.userId !== userId
          ) {
            return;
          }

          this._matrix.set(result ?? []);
          this.permissionsLoadedForUserId = userId;
        }),

        catchError((error) => {
          console.error('Failed to load permissions:', error);
          return of([]);
        }),

        finalize(() => {
          if (version === this.requestVersion) {
            this.permissionsRequest$ = null;
            this.permissionsRequestUserId = null;
          }
        }),

        shareReplay(1),
      );

    this.permissionsRequest$ = request$;
    this.permissionsRequestUserId = userId;

    return request$;
  }

  /**
   * Get reactive permissions for a module.
   */
  getModuleRights(moduleKey: string) {
    return computed((): ModuleRights => {
      const isSuperAdmin = this.currentUser?.systemRole === 'SuperAdmin';

      if (isSuperAdmin) {
        return {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canUpdateStatus: true,
        };
      }

      const keyLower = moduleKey.toLowerCase();

      const matches = this._matrix().filter(
        (permission) => (permission.moduleKey ?? '').toLowerCase() === keyLower,
      );

      if (!matches.length) {
        return {
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
          canUpdateStatus: false,
        };
      }

      return matches.reduce<ModuleRights>(
        (acc, curr) => ({
          canCreate: acc.canCreate || curr.canCreate,
          canRead: acc.canRead || curr.canRead,
          canUpdate: acc.canUpdate || curr.canUpdate,
          canDelete: acc.canDelete || curr.canDelete,
          canUpdateStatus: acc.canUpdateStatus || curr.canUpdateStatus,
        }),
        {
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
          canUpdateStatus: false,
        },
      );
    });
  }

  /**
   * Check whether the current user can view a module.
   */
  canReadModule(moduleKey: string | null | undefined): boolean {
    if (!moduleKey) {
      return false;
    }

    if (this.currentUser?.systemRole === 'SuperAdmin') {
      return true;
    }

    return this.getModuleRights(moduleKey)().canRead;
  }
}
