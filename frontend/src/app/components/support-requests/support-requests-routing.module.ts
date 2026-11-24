import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';
import { HardwareRequest } from './hardware-request/hardware-request/hardware-request';
import { MyRequests } from './hardware-request/my-requests/my-requests';
import { RequestForm } from './hardware-request/request-form/request-form';
import { HardwareRequestDetails } from './hardware-request/hardware-request-details/hardware-request-details';
import { IncomingHardwareRequest } from './hardware-request/incoming-hardware-request/incoming-hardware-request';

const routes: Routes = [
  {
    path: '',
    component: HardwareRequest,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'support-request' },
  },
  {
    path: 'details',
    component: HardwareRequestDetails,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'support-request/details' },
  },
  {
    path: 'incoming-request',
    component: IncomingHardwareRequest,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'support-request/incoming-request' },
  },
  {
    path: 'my-request',
    component: MyRequests,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'support-request/my-request' },
  },
  {
    path: 'form',
    component: RequestForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'support-request/form' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SupportRequestRoutingModule {}
