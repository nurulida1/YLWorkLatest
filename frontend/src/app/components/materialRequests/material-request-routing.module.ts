import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MaterialRequests } from './material-requests/material-requests';
import { MaterialRequestForm } from './material-request-form/material-request-form';

const routes: Routes = [
  {
    path: '',
    component: MaterialRequests,
  },
  {
    path: 'form',
    component: MaterialRequestForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MaterialRequestRoutingModule {}
