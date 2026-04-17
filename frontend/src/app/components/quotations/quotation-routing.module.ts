import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Quotation } from './quotation/quotation';

const routes: Routes = [
  {
    path: '',
    component: Quotation,
  },
  {
    path: 'form',
    // component: QuotationForm,
  },
  {
    path: 'sign',
    // component: QuotesView,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotationRoutingModule {}
