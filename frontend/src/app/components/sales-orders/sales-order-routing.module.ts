import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SalesOrder } from './salesOrder/salesOrder';
import { SalesOrderDetails } from './sales-order-details/sales-order-details';

const routes: Routes = [
  {
    path: '',
    component: SalesOrder,
  },

  {
    path: 'details',
    component: SalesOrderDetails,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalesOrderRoutingModule {}
