import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeaveApply } from './leave-apply/leave-apply';
import { LeaveApprovals } from './leave-approvals/leave-approvals';
import { LeaveDashboard } from './leave-dashboard/leave-dashboard';
import { LeaveDetail } from './leave-detail/leave-detail';
import { LeaveHistory } from './leave-history/leave-history';

const routes: Routes = [
  {
    path: '',
    component: LeaveDashboard,
    data: { moduleKey: 'leave' },
  },
  {
    path: 'apply',
    component: LeaveApply,
    data: { moduleKey: 'leave-apply' },
  },
  {
    path: 'apply/:id',
    component: LeaveApply,
    data: { moduleKey: 'leave-apply' },
  },
  {
    path: 'history',
    component: LeaveHistory,
    data: { moduleKey: 'leave-history' },
  },
  {
    path: 'approvals',
    component: LeaveApprovals,
    data: { moduleKey: 'leave-approvals' },
  },

  {
    path: ':id',
    component: LeaveDetail,
    data: { moduleKey: 'leave' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeaveRoutingModule {}
