import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Quotation } from './quotation/quotation';
import { QuotationForm } from './quotation-form/quotation-form';
import { QuotesView } from './quotes-view/quotes-view';

const routes: Routes = [
  {
    path: '',
    component: Quotation,
  },
  {
    path: 'form',
    component: QuotationForm,
  },
  {
    path: 'sign',
    component: QuotesView,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotationRoutingModule {}
