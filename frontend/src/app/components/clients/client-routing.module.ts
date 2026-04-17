import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Client } from './client/client';
import { ClientForm } from './client-form/client-form';

const routes: Routes = [
  {
    path: '',
    component: Client,
  },
  {
    path: 'form',
    component: ClientForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {}
