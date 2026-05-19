import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Invoice } from './invoice/invoice';
import { SalesInvoice } from './sales-invoice/sales-invoice';
import { PurchaseInvoice } from './purchase-invoice/purchase-invoice';
// import { InvoiceForm } from './invoice-form/invoice-form';

const routes: Routes = [
  {
    path: 'sales',
    component: SalesInvoice,
  },
  {
    path: 'purchase',
    component: PurchaseInvoice,
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
