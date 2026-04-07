import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PurchaseOrder } from './purchase-order/purchase-order';
import { PurchaseOrderForm } from './purchase-order-form/purchase-order-form';

const routes: Routes = [
  {
    path: '',
    component: PurchaseOrder,
  },
  {
    path: 'form',
    component: PurchaseOrderForm,
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
export class PurchaseOrderRoutingModule {}
