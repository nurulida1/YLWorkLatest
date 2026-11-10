import { BaseModel } from './BaseModel';

export interface ProductServiceDto extends BaseModel {
  itemCode: string;
  description: string;
  type: string;
  unit: string;
  price: number;
  availableStock?: number;
}

export interface CreateProductServiceRequest {
  itemCode: string;
  description: string;
  type: string;
  unit: string;
  price: number;
}

export interface UpdateProductServiceRequest extends CreateProductServiceRequest {
  id: string;
}
