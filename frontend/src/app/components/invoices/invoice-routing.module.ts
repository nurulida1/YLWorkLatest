import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Invoice } from './invoice/invoice';
import { InvoiceForm } from './invoice-form/invoice-form';

const routes: Routes = [
  {
    path: '',
    component: Invoice,
  },
  {
    path: 'form',
    component: InvoiceForm,
  },
  // {
  //   path: 'sign',
  //   component: QuotesView,
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvoiceRoutingModule {}
