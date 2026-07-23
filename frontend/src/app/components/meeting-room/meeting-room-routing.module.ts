import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MeetingRoom } from './meeting-room/meeting-room';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: MeetingRoom,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'meeting-room' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MeetingRoomRoutingModule {}
