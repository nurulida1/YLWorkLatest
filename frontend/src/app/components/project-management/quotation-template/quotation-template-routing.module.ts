import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { modulePermissionGuard } from '../../../common/permission/module-permission.guard';
import { QuotationTemplate } from './quotation-template/quotation-template';
import { QuotationTemplateForm } from './quotation-template-form/quotation-template-form';

const routes: Routes = [
  {
    path: '',
    component: QuotationTemplate,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'quotation-template' },
  },
  {
    path: 'form',
    component: QuotationTemplateForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'quotation-template/form' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotationTemplateRoutingModule {}
