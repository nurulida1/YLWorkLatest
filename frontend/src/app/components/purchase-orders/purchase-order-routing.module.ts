import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PurchaseOrderForm } from './purchase-order-form/purchase-order-form';
import { ClientPurchaseOrder } from './client-purchase-order/client-purchase-order';
import { SupplierPurchaseOrder } from './supplier-purchase-order/supplier-purchase-order';
import { PurchaseOrder } from './purchaseOrder/purchaseOrder';

const routes: Routes = [
  {
    path: '',
    component: PurchaseOrder,
  },
  {
    path: 'client',
    component: ClientPurchaseOrder,
  },
  {
    path: 'supplier',
    component: SupplierPurchaseOrder,
  },
  {
    path: 'supplier/form',
    component: PurchaseOrderForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PurchaseOrderRoutingModule {}
