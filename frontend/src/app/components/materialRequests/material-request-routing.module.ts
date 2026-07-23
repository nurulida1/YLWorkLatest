import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MaterialRequestForm } from './material-request-form/material-request-form';
import { MaterialRequests } from './material-requests/material-requests';
import { MaterialRequestMobileForm } from './material-request-mobile-form/material-request-mobile-form';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: MaterialRequests,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'material-requests' },
  },
  {
    path: 'form',
    component: MaterialRequestForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'material-requests' },
  },
  {
    path: 'create',
    component: MaterialRequestMobileForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'material-requests' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MaterialRequestRoutingModule {}
