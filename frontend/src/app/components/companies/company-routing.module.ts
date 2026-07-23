import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Company } from './company/company';
import { CompanyForm } from './company-form/company-form';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: Company,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'company' },
  },
  {
    path: 'form',
    component: CompanyForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'company' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompanyRoutingModule {}
