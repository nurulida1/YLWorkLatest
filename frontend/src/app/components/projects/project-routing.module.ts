import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Project } from './project/project';
import { ProjectDetails } from './project-details/project-details';
import { ProjectForm } from './project-form/project-form';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: Project,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'projects' },
  },
  {
    path: 'form',
    component: ProjectForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'projects' },
  },
  {
    path: 'details',
    component: ProjectDetails,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'projects' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectRoutingModule {}
