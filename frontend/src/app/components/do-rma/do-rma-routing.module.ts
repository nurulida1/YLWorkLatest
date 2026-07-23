import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DoRma } from './do-rma/do-rma';
import { DoRmaForm } from './do-rma-form/do-rma-form';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: DoRma,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'do-rma' },
  },
  {
    path: 'form',
    component: DoRmaForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'do-rma' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DORMARoutingModule {}
