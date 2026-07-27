import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserManagement } from './user-management/user-management';
import { RolePermissions } from './role-permissions/role-permissions';
import { SystemModule } from './system-module/system-module';
import { LeaveTypesSettings } from './leave-types/leave-types';
import { LeavePolicySettings } from './leave-policy/leave-policy';
import { LeaveCalendarSyncSettings } from './leave-calendar-sync/leave-calendar-sync';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: 'user-management',
    component: UserManagement,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'settings-user-management' },
  },
  {
    path: 'role-permission',
    component: RolePermissions,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'settings-role-permission' },
  },
  {
    path: 'system-module',
    component: SystemModule,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'settings-system-module' },
  },
  {
    path: 'leave-types',
    component: LeaveTypesSettings,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'settings-leave-types' },
  },
  {
    path: 'leave-policy',
    component: LeavePolicySettings,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'settings-leave-policy' },
  },
  {
    path: 'leave-calendar-sync',
    component: LeaveCalendarSyncSettings,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'settings-leave-calendar-sync' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
