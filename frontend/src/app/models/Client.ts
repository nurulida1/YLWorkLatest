import { AddressDto, AddressRequest } from './Address';
import { BaseModel } from './BaseModel';

export interface ClientDto extends BaseModel {
  name: string;
  contactPerson: string;
  contactNo: string;
  billingAddressId: string;
  billingAddress: AddressDto;
  deliveryAddressId: string;
  deliveryAddress: AddressDto;
  email: string;
  status: string;
}

export interface CreateClientRequest {
  name: string;
  contactPerson: string;
  contactNo: string;
  billingAddress: AddressRequest;
  deliveryAddress: AddressRequest;
  email: string;
}

export interface UpdateClientRequest extends CreateClientRequest {
  id: string;
}
