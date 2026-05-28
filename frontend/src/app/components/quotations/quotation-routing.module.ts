import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Quotation } from './quotation/quotation';
import { QuotationForm } from './quotation-form/quotation-form';
import { permissionGuard } from '../../common/permission.guard';

const routes: Routes = [
  {
    path: '',
    component: Quotation,
    // canActivate: [permissionGuard('Quotation', 'canRead')],
  },

  {
    path: 'form',
    component: QuotationForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotationRoutingModule {}
