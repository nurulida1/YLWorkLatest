import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GoodsReceiving } from './goods-receiving/goods-receiving';
import { GoodsReceivedForm } from './goods-received-form/goods-received-form';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: GoodsReceiving,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'goods-receiving' },
  },
  {
    path: 'form',
    component: GoodsReceivedForm,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'goods-receiving' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GoodsReceivingRoutingModule {}
