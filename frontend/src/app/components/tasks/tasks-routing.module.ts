import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TasksForm } from './tasks-form/tasks-form';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';
import { StaffTasks } from '../staffTasks/staffTasks';

const routes: Routes = [
  {
    path: '',
    component: StaffTasks,
    data: { moduleKey: 'my-tasks' },
  },
  {
    path: 'form',
    component: TasksForm,
    data: { moduleKey: 'tasks' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksRoutingModule {}
