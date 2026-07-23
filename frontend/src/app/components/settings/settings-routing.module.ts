import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserManagement } from './user-management/user-management';
import { RolePermissions } from './role-permissions/role-permissions';
import { SystemModule } from './system-module/system-module';
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
