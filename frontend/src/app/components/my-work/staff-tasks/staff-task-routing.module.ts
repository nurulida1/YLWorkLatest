import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { modulePermissionGuard } from '../../../common/permission/module-permission.guard';
import { StaffTasks } from './staffTasks/staffTasks';
import { StaffTaskForm } from './staff-task-form/staff-task-form';

const routes: Routes = [
  {
    path: '',
    component: StaffTasks,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'staff-tasks' },
  },
  {
    path: 'form',
    component: StaffTaskForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'staff-tasks/form' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StaffTaskRoutingModule {}
