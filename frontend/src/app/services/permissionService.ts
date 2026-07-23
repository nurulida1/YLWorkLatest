import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserService } from './userService.service';
import { ModuleRights, RolePermissionDto } from '../models/RolePermission';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly _matrix = signal<RolePermissionDto[]>([]);
  public readonly matrix = this._matrix.asReadonly();
  private cachedUserId: string | null = null;

  constructor() {
    this.userService.currentUser$.subscribe((user) => {
      if (!user) {
        this.clearCache();
        this.cachedUserId = null;
        return;
      }
      if (this.cachedUserId !== user.userId) {
        this.clearCache();
        this.cachedUserId = user.userId;
      }
    });
  }

  get currentUser() {
    return this.userService.currentUser;
  }

  clearCache(): void {
    this._matrix.set([]);
  }

  loadPermissions() {
    const user = this.currentUser;

    if (!user?.systemRole) {
      this._matrix.set([]);
      return of([]);
    }

    const role = user.systemRole;

    const departmentIds = user.departmentIds ?? [];

    let url = `${environment.ApiBaseUrl}/RolePermission/by-matrix?systemRole=${encodeURIComponent(role)}`;

    if (departmentIds.length > 0) {
      departmentIds.forEach((id: string) => {
        url += `&departmentIds=${id}`;
      });
    }

    return this.http.get<RolePermissionDto[]>(url).pipe(
      tap((permissions) => {
        this._matrix.set(Array.isArray(permissions) ? permissions : []);
      }),

      catchError((error) => {
        console.error('Permission load failed:', error);

        this._matrix.set([]);

        return of([]);
      }),
    );
  }

  getModuleRights(moduleKey: string) {
    return computed((): ModuleRights => {
      const allPerms = this._matrix();

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
      const matches = allPerms.filter(
        (p) => (p.moduleKey ?? '').toLowerCase() === keyLower,
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
}
