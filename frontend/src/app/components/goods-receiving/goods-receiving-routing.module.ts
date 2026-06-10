import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GoodsReceiving } from './goods-receiving/goods-receiving';
import { GoodsReceivedForm } from './goods-received-form/goods-received-form';

const routes: Routes = [
  {
    path: '',
    component: GoodsReceiving,
  },
  {
    path: 'form',
    component: GoodsReceivedForm,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GoodsReceivingRoutingModule {}
