import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Quotation } from './quotation/quotation';
import { QuotationForm } from './quotation-form/quotation-form';
import { permissionGuard } from '../../common/permission.guard';

const routes: Routes = [
  {
    path: '',
    component: Quotation,
    canActivate: [permissionGuard('QUOTATION', 'canRead')],
  },

  {
    path: 'form',
    component: QuotationForm,
    canActivate: [permissionGuard('QUOTATION', ['canCreate', 'canUpdate'])],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotationRoutingModule {}
