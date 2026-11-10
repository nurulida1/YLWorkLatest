import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { modulePermissionGuard } from '../../../common/permission/module-permission.guard';
import { WorkOrder } from './work-order/work-order';

const routes: Routes = [
  {
    path: '',
    component: WorkOrder,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'work-order' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkOrderRoutingModule {}
