import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Meeting } from './meeting/meeting';
import { MeetingForm } from './meeting-form/meeting-form';

const routes: Routes = [
  {
    path: '',
    component: Meeting,
  },
  {
    path: 'form',
    component: MeetingForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MeetingRoutingModule {}
