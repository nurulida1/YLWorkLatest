import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DoRma } from './do-rma/do-rma';
import { DoRmaForm } from './do-rma-form/do-rma-form';

const routes: Routes = [
  {
    path: '',
    component: DoRma,
  },
  {
    path: 'form',
    component: DoRmaForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DORMARoutingModule {}
