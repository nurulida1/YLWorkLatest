import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Meeting } from './meeting/meeting';

const routes: Routes = [
  {
    path: '',
    component: Meeting,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MeetingRoutingModule {}
