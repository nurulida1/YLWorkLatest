import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MaterialRequestForm } from './material-request-form/material-request-form';
import { MaterialRequests } from './material-requests/material-requests';
import { MaterialRequestMobileForm } from './material-request-mobile-form/material-request-mobile-form';

const routes: Routes = [
  {
    path: '',
    component: MaterialRequests,
  },
  {
    path: 'form',
    component: MaterialRequestForm,
  },
  {
    path: 'create',
    component: MaterialRequestMobileForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MaterialRequestRoutingModule {}
