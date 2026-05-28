import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Quotation } from './quotation/quotation';
import { QuotationForm } from './quotation-form/quotation-form';
import { permissionGuard } from '../../common/permission.guard';

const routes: Routes = [
  {
    path: '',
    component: Quotation,
    canActivate: [permissionGuard('Quotations', 'canRead')],
  },

  {
    path: 'form',
    component: QuotationForm,
    canActivate: [permissionGuard('Quotations', 'canCreate')],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotationRoutingModule {}
