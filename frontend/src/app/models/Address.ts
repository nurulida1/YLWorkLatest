import { BaseModel } from './BaseModel';

export interface AddressDto extends BaseModel {
  name: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  poscode: string;
}

export interface AddressRequest {
  name: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  poscode: string;
}
