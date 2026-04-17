import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    // component: PurchaseOrder,
  },
  {
    path: 'form',
    // component: PurchaseOrderForm,
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
