import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SupplierForm } from './supplier-form/supplier-form';
import { Supplier } from './supplier/supplier';

const routes: Routes = [
  {
    path: '',
    component: Supplier,
  },
  {
    path: 'form',
    component: SupplierForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SupplierRoutingModule {}
