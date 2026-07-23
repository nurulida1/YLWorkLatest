import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PurchaseOrderForm } from './purchase-order-form/purchase-order-form';
import { ClientPurchaseOrder } from './client-purchase-order/client-purchase-order';
import { SupplierPurchaseOrder } from './supplier-purchase-order/supplier-purchase-order';
import { PurchaseOrder } from './purchaseOrder/purchaseOrder';
import { PurchaseOrderDetails } from './purchase-order-details/purchase-order-details';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: PurchaseOrder,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'purchase-orders' },
  },
  {
    path: 'client',
    component: ClientPurchaseOrder,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'purchase-orders-client' },
  },
  {
    path: 'supplier',
    component: SupplierPurchaseOrder,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'purchase-orders-supplier' },
  },
  {
    path: 'form',
    component: PurchaseOrderForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'purchase-orders' },
  },
  {
    path: 'details',
    component: PurchaseOrderDetails,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'purchase-orders' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PurchaseOrderRoutingModule {}
