import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Announcements } from './announcements/announcements';
import { AnnouncementForm } from './announcement-form/announcement-form';

const routes: Routes = [
  {
    path: '',
    component: Announcements,
    data: { moduleKey: 'announcement' },
  },
  {
    path: 'form',
    component: AnnouncementForm,
    data: { moduleKey: 'announcement-form' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnnouncementRoutingModule {}
