import { CompanyType } from '../shared/enum/enum';
import { AddressDto, AddressRequest } from './Address';
import { BaseModel } from './BaseModel';

export interface CompanyDto extends BaseModel {
  name: string;
  billingAddressId?: string;
  billingAddress?: AddressDto;
  deliveryAddressId?: string;
  deliveryAddress?: AddressDto;
  contactNo: string;
  contactPerson1: string;
  contactPerson2: string;
  email: string;
  faxNo: string;
  acNo: string;
  websiteUrl: string;
  type: CompanyType;
  balancePayment: number;
  isActive: boolean;
  logoImage: string;
  tinNo: string;
  sstRegNo: string;
  sameAsBillingAddress: boolean;
}

export interface CreateCompanyRequest {
  name: string;
  billingAddress?: AddressRequest;
  deliveryAddress?: AddressRequest;
  contactNo?: string;
  contactPerson1?: string;
  contactPerson2?: string;
  faxNo?: string;
  acNo?: string;
  email?: string;
  websiteUrl?: string;
  type: CompanyType;
  logoImage?: string;
  tinNo: string;
  sstRegNo: string;
  sameAsBillingAddress: boolean;
}

export interface UpdateCompanyRequest extends CreateCompanyRequest {
  id: string;
}
