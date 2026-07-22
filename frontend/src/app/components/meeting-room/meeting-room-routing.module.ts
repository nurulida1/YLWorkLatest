import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MeetingRoom } from './meeting-room/meeting-room';

const routes: Routes = [
  {
    path: '',
    component: MeetingRoom,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MeetingRoomRoutingModule {}
