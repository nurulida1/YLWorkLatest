import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CategoryInventory } from './categoryInventory/categoryInventory';
import { LocationInventory } from './locationInventory/locationInventory';
import { SectionInventory } from './sectionInventory/sectionInventory';
import { Inventory } from './inventory/inventory';
import { InventoryItem } from './inventory-item/inventory-item';
import { modulePermissionGuard } from '../../common/permission/module-permission.guard';

const routes: Routes = [
  { path: '', redirectTo: 'listing', pathMatch: 'full' },
  {
    path: 'listing',
    component: Inventory,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'inventory-listing' },
  },
  {
    path: 'item/:id',
    component: InventoryItem,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'inventory-listing' },
  },
  {
    path: 'category',
    component: CategoryInventory,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'inventory-category' },
  },
  {
    path: 'location',
    component: LocationInventory,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'inventory-location' },
  },
  {
    path: 'section',
    component: SectionInventory,
    canActivate: [modulePermissionGuard],
    data: { moduleKey: 'inventory-section' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventoryRoutingModule {}
