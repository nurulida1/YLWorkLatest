import { AddressDto, AddressRequest } from './Address';
import { BaseModel } from './BaseModel';

export interface SupplierDto extends BaseModel {
  name: string;
  contactPerson: string;
  contactNo: string;
  billingAddressId: string;
  billingAddress: AddressDto;
  deliveryAddressId: string;
  deliveryAddress: AddressDto;
  email: string;
  status: string;
  balance: number;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson: string;
  contactNo: string;
  billingAddress: AddressRequest;
  deliveryAddress: AddressRequest;
  email: string;
  balance: number;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {
  id: string;
}
