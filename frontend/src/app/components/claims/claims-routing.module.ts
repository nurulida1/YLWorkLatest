import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClaimApply } from './claim-apply/claim-apply';
import { ClaimApprovals } from './claim-approvals/claim-approvals';
import { ClaimDashboard } from './claim-dashboard/claim-dashboard';
import { ClaimDetail } from './claim-detail/claim-detail';
import { ClaimHistory } from './claim-history/claim-history';

const routes: Routes = [
  {
    path: '',
    component: ClaimDashboard,
    data: { moduleKey: 'claims' },
  },
  {
    path: 'apply',
    component: ClaimApply,
    data: { moduleKey: 'claims' },
  },
  {
    path: 'apply/:id',
    component: ClaimApply,
    data: { moduleKey: 'claims' },
  },
  {
    path: 'history',
    component: ClaimHistory,
    data: { moduleKey: 'claims' },
  },
  {
    path: 'approvals',
    component: ClaimApprovals,
    data: { moduleKey: 'claims' },
  },
  {
    path: ':id',
    component: ClaimDetail,
    data: { moduleKey: 'claims' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClaimsRoutingModule {}
