import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Client } from './client/client';
import { ClientForm } from './client-form/client-form';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: Client,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'clients' },
  },
  {
    path: 'form',
    component: ClientForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'clients' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {}
