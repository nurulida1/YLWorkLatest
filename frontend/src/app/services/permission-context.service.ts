import { Injectable, computed, inject, signal } from '@angular/core';
import { PermissionService } from './permissionService';
import { UserService } from './userService.service';
import { EMPTY_MODULE_RIGHTS } from '../common/permission/permission.types';
import type { ModuleRights } from '../models/RolePermission';

@Injectable({ providedIn: 'root' })
export class PermissionContextService {
  private readonly permissionService = inject(PermissionService);
  private readonly userService = inject(UserService);
  private readonly _moduleKey = signal<string | null>(null);

  constructor() {
    this.userService.currentUser$.subscribe((user) => {
      if (!user) {
        this.reset();
      }
    });
  }

  readonly moduleKey = this._moduleKey.asReadonly();

  readonly rights = computed((): ModuleRights => {
    const key = this._moduleKey();
    if (!key) {
      return { ...EMPTY_MODULE_RIGHTS };
    }
    return this.permissionService.getModuleRights(key)();
  });

  setModuleKey(moduleKey: string | null): void {
    this._moduleKey.set(moduleKey);
  }

  can(action: keyof ModuleRights): boolean {
    return this.rights()[action] === true;
  }

  reset(): void {
    this._moduleKey.set(null);
  }
}
