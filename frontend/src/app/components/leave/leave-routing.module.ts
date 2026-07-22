import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ApplyLeave } from './apply-leave/apply-leave';

const routes: Routes = [
  {
    path: 'apply',
    component: ApplyLeave,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeaveRoutingModule {}
