import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SalesInvoice } from './sales-invoice/sales-invoice';
import { PurchaseInvoice } from './purchase-invoice/purchase-invoice';
import { InvoiceForm } from './invoice-form/invoice-form';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'sales',
    pathMatch: 'full',
  },
  {
    path: 'sales',
    component: SalesInvoice,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'invoice-sales' },
  },
  {
    path: 'purchase',
    component: PurchaseInvoice,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'invoice-purchase' },
  },
  {
    path: 'sales/form',
    component: InvoiceForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'invoice-sales' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvoiceRoutingModule {}
