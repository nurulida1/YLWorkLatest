import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TasksList } from './tasks-list/tasks-list';
import { TasksForm } from './tasks-form/tasks-form';

const routes: Routes = [
  {
    path: '',
    component: TasksList,
  },
  {
    path: 'form',
    component: TasksForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksRoutingModule {}
