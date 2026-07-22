import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Project } from './project/project';
import { ProjectDetails } from './project-details/project-details';
import { ProjectForm } from './project-form/project-form';

const routes: Routes = [
  {
    path: '',
    component: Project,
  },
  {
    path: 'form',
    component: ProjectForm,
  },
  {
    path: 'details',
    component: ProjectDetails,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectRoutingModule {}
