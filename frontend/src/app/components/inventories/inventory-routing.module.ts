import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CategoryInventory } from './categoryInventory/categoryInventory';
import { LocationInventory } from './locationInventory/locationInventory';
import { SectionInventory } from './sectionInventory/sectionInventory';
import { Inventory } from './inventory/inventory';

const routes: Routes = [
  {
    path: 'listing',
    component: Inventory,
  },
  {
    path: 'category',
    component: CategoryInventory,
  },
  {
    path: 'location',
    component: LocationInventory,
  },
  {
    path: 'section',
    component: SectionInventory,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventoryRoutingModule {}
