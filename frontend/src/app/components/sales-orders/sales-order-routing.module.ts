import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SalesOrder } from './salesOrder/salesOrder';
import { SalesOrderDetails } from './sales-order-details/sales-order-details';
import { SalesOrderReview } from './sales-order-review/sales-order-review';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: SalesOrder,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'sales-order' },
  },
  {
    path: 'details',
    component: SalesOrderDetails,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'sales-order' },
  },
  {
    path: 'reviews',
    component: SalesOrderReview,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'sales-order' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalesOrderRoutingModule {}
