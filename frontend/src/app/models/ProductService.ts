import { BaseModel } from './BaseModel';

export interface ProductServiceDto extends BaseModel {
  name: string;
  code: string;
  description: string;
  type: string;
  unit: string;
  price: number;
  quantity: number;
}

export interface CreateProductServiceRequest {
  name: string;
  code: string;
  description: string;
  type: string;
  unit: string;
  price: number;
  quantity: number;
}

export interface UpdateProductServiceRequest extends CreateProductServiceRequest {
  id: string;
}
