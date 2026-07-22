import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClaimForm } from './claim-form/claim-form';

const routes: Routes = [
  {
    path: 'create',
    component: ClaimForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClaimsRoutingModule {}
