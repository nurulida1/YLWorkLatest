import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DeliveryOrderForm } from './delivery-order-form/delivery-order-form';
import { DoRma } from '../do-rma/do-rma/do-rma';
import { DeliveryOrders } from './delivery-orders/delivery-orders';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'goods-receiving',
    pathMatch: 'full',
  },
  {
    path: 'goods-receiving',
    component: DeliveryOrders,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'delivery-orders-goods-receiving' },
  },
  {
    path: 'goods-dispatch',
    component: DeliveryOrders,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'delivery-orders-goods-dispatch' },
  },
  {
    path: 'form',
    component: DeliveryOrderForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'delivery-orders-goods-dispatch' },
  },
  {
    path: 'outbound/form',
    component: DeliveryOrderForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'delivery-orders-goods-dispatch' },
  },
  {
    path: 'rma',
    component: DoRma,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'delivery-orders-rma' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeliveryOrderRoutingModule {}
