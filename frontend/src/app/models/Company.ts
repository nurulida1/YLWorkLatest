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
  primaryContactPerson: string;
  primaryContactNo: string;
  primaryEmail: string;
  secondaryContactPerson: string;
  secondaryContactNo: string;
  secondaryEmail: string;
  registrationNo: string;
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
  ssmRegNo: string;
  sameAsBillingAddress: boolean;
}

export interface CreateCompanyRequest {
  name: string;
  billingAddress?: AddressRequest;
  deliveryAddress?: AddressRequest;
  contactNo?: string;
  primaryContactPerson: string;
  primaryContactNo: string;
  primaryEmail: string;
  secondaryContactPerson: string;
  secondaryContactNo: string;
  secondaryEmail: string;
  faxNo?: string;
  acNo?: string;
  email?: string;
  websiteUrl?: string;
  type: CompanyType;
  registrationNo: string;
  logoImage?: string;
  tinNo: string;
  sstRegNo: string;
  ssmRegNo: string;
  sameAsBillingAddress: boolean;
}

export interface UpdateCompanyRequest extends CreateCompanyRequest {
  id: string;
}
