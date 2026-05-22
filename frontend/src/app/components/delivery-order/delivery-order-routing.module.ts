import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InboundDo } from './inbound-do/inbound-do';
import { OutboundDo } from './outbound-do/outbound-do';
import { DeliveryOrderForm } from './delivery-order-form/delivery-order-form';
import { DoRma } from './do-rma/do-rma';

const routes: Routes = [
  {
    path: 'inbound',
    component: InboundDo,
  },
  {
    path: 'outbound',
    component: OutboundDo,
  },
  {
    path: 'outbound/form',
    component: DeliveryOrderForm,
  },
  {
    path: 'rma',
    component: DoRma,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeliveryOrderRoutingModule {}
