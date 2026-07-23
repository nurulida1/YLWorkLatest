import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TasksList } from './tasks-list/tasks-list';
import { TasksForm } from './tasks-form/tasks-form';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: TasksList,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'tasks' },
  },
  {
    path: 'form',
    component: TasksForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'tasks' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksRoutingModule {}
