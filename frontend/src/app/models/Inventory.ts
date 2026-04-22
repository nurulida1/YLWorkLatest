import { BaseModel, BaseOption, DropdownDto } from './BaseModel';
import { UserDto } from './User';

export interface InventoryDto extends BaseModel {
  itemName: string;
  brand: string;
  model: string;
  categoryId: string;
  category: BaseOption;
  description: string;
  unit: string;
  quantity: number;
  serialNumber: string;
  referenceType: string;
  referenceId: string;
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
}

export interface CreateInventoryRequest {
  itemName: string;
  brand: string;
  model: string;
  categoryId: string;
  description: string;
  unit: string;
  quantity: number;
  serialNumber: string;
  referenceType: string;
  referenceId: string;
  locationId: string;
  sectionId: string;
  parLevel: string;
  date: Date;
  status: string;
  remarks: string;
  costs: number;
  attachment: string;
}

export interface UpdateInventoryRequest extends CreateInventoryRequest {
  id: string;
}

export interface InventoryDropdownResponse {
  sections: DropdownDto[];
  categories: DropdownDto[];
  locations: DropdownDto[];
}
