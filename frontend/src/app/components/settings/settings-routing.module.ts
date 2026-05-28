import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserManagement } from './user-management/user-management';
import { RolePermissions } from './role-permissions/role-permissions';
import { SystemModule } from './system-module/system-module';

const routes: Routes = [
  {
    path: 'user-management',
    component: UserManagement,
  },

  {
    path: 'role-permission',
    component: RolePermissions,
  },

  {
    path: 'system-module',
    component: SystemModule,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
