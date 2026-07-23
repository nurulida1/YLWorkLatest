import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClaimForm } from './claim-form/claim-form';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: 'create',
    component: ClaimForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'claims' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClaimsRoutingModule {}
