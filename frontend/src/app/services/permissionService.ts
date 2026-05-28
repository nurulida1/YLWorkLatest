import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { UserService } from './userService.service';
import { ModuleRights, RolePermissionDto } from '../models/RolePermission';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);

  private readonly _matrix = signal<RolePermissionDto[]>([]);
  public readonly matrix = this._matrix.asReadonly();

  loadPermissions() {
    const user = this.userService.currentUser;

    if (!user?.systemRole) return of([]);

    const role = user.systemRole;

    const departmentIds = user.departmentIds ?? [];

    let url = `api/RolePermission/by-matrix?systemRole=${encodeURIComponent(role)}`;

    if (departmentIds.length > 0) {
      departmentIds.forEach((id) => {
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

      const isSuperAdmin =
        this.userService.currentUser?.systemRole === 'SuperAdmin';

      if (isSuperAdmin) {
        return {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canUpdateStatus: true,
        };
      }

      const matches = allPerms.filter(
        (p) => p.moduleKey === moduleKey || p.moduleName === moduleKey,
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

      const initial: ModuleRights = {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canUpdateStatus: false,
      };

      return matches.reduce<ModuleRights>(
        (acc, curr) => ({
          canCreate: acc.canCreate || curr.canCreate,
          canRead: acc.canRead || curr.canRead,
          canUpdate: acc.canUpdate || curr.canUpdate,
          canDelete: acc.canDelete || curr.canDelete,
          canUpdateStatus: acc.canUpdateStatus || curr.canUpdateStatus,
        }),
        initial,
      );
    });
  }
}
