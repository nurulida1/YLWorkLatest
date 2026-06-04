import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SalesOrder } from './salesOrder/salesOrder';
import { SalesOrderDetails } from './sales-order-details/sales-order-details';
import { permissionGuard } from '../../common/permission.guard';

const routes: Routes = [
  {
    path: '',
    component: SalesOrder,
    canActivate: [permissionGuard('SALES_ORDER', 'canRead')],
  },

  {
    path: 'details',
    component: SalesOrderDetails,
    canActivate: [permissionGuard('SALES_ORDER', 'canUpdateStatus')],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalesOrderRoutingModule {}
