import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeaveApply } from './leave-apply/leave-apply';
import { LeaveApprovals } from './leave-approvals/leave-approvals';
import { LeaveDashboard } from './leave-dashboard/leave-dashboard';
import { LeaveDetail } from './leave-detail/leave-detail';
import { LeaveHistory } from './leave-history/leave-history';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: LeaveDashboard,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'leave' },
  },
  {
    path: 'apply',
    component: LeaveApply,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'leave-apply' },
  },
  {
    path: 'apply/:id',
    component: LeaveApply,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'leave-apply' },
  },
  {
    path: 'history',
    component: LeaveHistory,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'leave-history' },
  },
  {
    path: 'approvals',
    component: LeaveApprovals,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'leave-approvals' },
  },
  {
    path: ':id',
    component: LeaveDetail,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'leave' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeaveRoutingModule {}
