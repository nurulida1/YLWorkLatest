import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeaveApply } from './leave-apply/leave-apply';
import { LeaveApprovals } from './leave-approvals/leave-approvals';
import { LeaveDashboard } from './leave-dashboard/leave-dashboard';
import { LeaveDetail } from './leave-detail/leave-detail';
import { LeaveHistory } from './leave-history/leave-history';

const routes: Routes = [
  { path: '', component: LeaveDashboard },
  { path: 'apply', component: LeaveApply },
  { path: 'apply/:id', component: LeaveApply },
  { path: 'history', component: LeaveHistory },
  { path: 'approvals', component: LeaveApprovals },
  { path: ':id', component: LeaveDetail },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeaveRoutingModule {}
