import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { modulePermissionGuard } from '../../../common/permission/module-permission.guard';
import { WorkOrder } from './work-order/work-order';
import { WorkOrderForm } from './work-order-form/work-order-form';
import { WorkOrderDetails } from './work-order-details/work-order-details';

const routes: Routes = [
  {
    path: '',
    component: WorkOrder,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'work-order' },
  },
  {
    path: 'form',
    component: WorkOrderForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'work-order/form' },
  },
  {
    path: 'details',
    component: WorkOrderDetails,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'work-order/details' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkOrderRoutingModule {}
