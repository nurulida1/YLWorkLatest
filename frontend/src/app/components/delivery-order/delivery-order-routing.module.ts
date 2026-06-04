import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DeliveryOrderForm } from './delivery-order-form/delivery-order-form';
import { DoRma } from '../do-rma/do-rma/do-rma';
import { DeliveryOrders } from './delivery-orders/delivery-orders';

const routes: Routes = [
  {
    path: '',
    component: DeliveryOrders,
  },
  {
    path: 'form',
    component: DeliveryOrderForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeliveryOrderRoutingModule {}
