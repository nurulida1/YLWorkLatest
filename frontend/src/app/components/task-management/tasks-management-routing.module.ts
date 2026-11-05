import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';
import { StaffTasks } from './staffTasks/staffTasks';
import { TaskForm } from './task-form/task-form';

const routes: Routes = [
  {
    path: '',
    component: StaffTasks,
    data: { moduleKey: 'task-management' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TaskManagementRoutingModule {}
