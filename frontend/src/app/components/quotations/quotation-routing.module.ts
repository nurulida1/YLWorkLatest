import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Quotation } from './quotation/quotation';
import { QuotationForm } from './quotation-form/quotation-form';
import { ViewDetails } from './view-details/view-details';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: Quotation,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'quotations' },
  },
  {
    path: 'form',
    component: QuotationForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'quotations' },
  },
  {
    path: 'details',
    component: ViewDetails,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'quotations' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotationRoutingModule {}
