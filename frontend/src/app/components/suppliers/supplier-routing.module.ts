import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SupplierForm } from './supplier-form/supplier-form';
import { Supplier } from './supplier/supplier';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: Supplier,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'supplier' },
  },
  {
    path: 'form',
    component: SupplierForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'supplier' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SupplierRoutingModule {}
