import { SectionInventory } from '../components/inventories/sectionInventory/sectionInventory';
import { BaseModel, BaseOption, DropdownDto } from './BaseModel';
import { ProductServiceDto } from './ProductService';
import { UserDto } from './User';

export interface InventoryDto extends BaseModel {
  itemCode: string;
  itemName: string;
  brand: string;
  model: string;
  availableQuantity: number;
  categoryId: string;
  category: BaseOption;
  productServiceId: string;
  productService: ProductServiceDto;
  description: string;
  unit: string;
  quantity: number;
  reservedQuantity: number;
  serialNumber: string;
  locationId: string;
  location: BaseOption;
  sectionId: string;
  section: BaseOption;
  parLevel: string;
  date: Date;
  status: string;
  remarks: string;
  costs: number;
  attachment: string;
  createdById: string;
  createdBy: UserDto;
  stockType: string;
}

export interface CreateInventoryRequest {
  itemCode: string;
  itemName: string;
  brand: string;
  model: string;
  categoryId: string;
  description: string;
  unit: string;
  quantity: number;
  serialNumber: string;
  locationId: string;
  sectionId: string;
  parLevel: string;
  date: Date;
  status: string;
  remarks: string;
  costs: number;
  attachment: string;
  reservedQuantity: number;
  productServiceId: string;
}

export interface UpdateInventoryRequest extends CreateInventoryRequest {
  id: string;
}

export interface InventoryDropdownResponse {
  sections: DropdownDto[];
  categories: DropdownDto[];
  locations: DropdownDto[];
}

export interface InventoryDashboardResponseDto {
  totalItems: number;
  lowStockItems: number;
  faultyItems: number;
  pendingRequests: number;
  restockAlerts: InventoryRestockDto[];
  categoryChart: InventoryCategoryChartDto[];
}

export interface InventoryCategoryChartDto {
  categoryName: string;
  total: number;
}

export interface InventoryRestockDto {
  id: string;
  name: string;
  quantity: number;
  parLevel: number;
  brand: string;
  section: SectionInventory;
}

export interface StockTransaction {
  id: string;
  inventoryId: string;
  type: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  createdAt: Date;
}

export interface InventoryAuditFieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface InventoryAuditChangesPayload {
  message: string | null;
  fields: InventoryAuditFieldChange[];
}

export interface InventoryAuditDto {
  id: string;
  inventoryId: string;
  action: string;
  userId: string | null;
  userName: string | null;
  createdAt: string;
  changes: InventoryAuditChangesPayload;
}
