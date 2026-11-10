import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { modulePermissionGuard } from '../../../common/permission/module-permission.guard';
import { JobSheet } from './job-sheet/job-sheet';

const routes: Routes = [
  {
    path: '',
    component: JobSheet,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'job-sheet' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class JobSheetRoutingModule {}
