import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Company } from './company/company';
import { CompanyForm } from './company-form/company-form';

const routes: Routes = [
  {
    path: '',
    component: Company,
  },
  {
    path: 'form',
    component: CompanyForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompanyRoutingModule {}
