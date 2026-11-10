import { BaseModel } from './BaseModel';
import { CompanyDropdownItem, CompanyDto } from './Company';
import { DeliveryOrderDto, DODropdownDto } from './DeliveryOrder';
import { ProjectDropdownDto } from './Project';
import { UserDto } from './User';

export interface DeliveryOrderRMA extends BaseModel {
  deliveryOrderRMANo: string;

  deliveryOrderId: string | null;
  deliveryOrder?: DeliveryOrderDto | null;

  date: Date | string | null;

  returnType: string | null;
  returnQuantity: number | null;
  returnMethod: string | null;
  returnAction: string | null;

  senderCompanyId: string | null;
  senderCompany?: CompanyDto | null;

  receiverCompanyId: string | null;
  receiverCompany?: CompanyDto | null;

  reason: string | null;
  remarks: string | null;
  status: string;

  actionUserId: string | null;
  actionUserName: string | null;
  signatureImage: string | null;

  dormaItems?: DORMAItem[];
  dormaProofImages?: DORMAProofImage[];
  dormaStatusHistories?: DORMAStatusHistory[];
}

export interface DORMAItem {
  id: string;
  deliveryOrderRMAId: string;
  deliveryOrderRMA?: DeliveryOrderRMA;

  salesOrderItemId: string | null;
  deliveryOrderItemId: string | null;

  description: string | null;
  quantity: number | null;
  unit: string | null;
  condition: string | null;
  remarks: string | null;
}

export interface CreateDeliveryOrderRMARequest {
  deliveryOrderRMANo: string;
  deliveryOrderId: string | null;
  date: Date | string | null;

  returnType: string | null;
  returnQuantity: number | null;
  returnMethod: string | null;
  returnAction: string | null;

  senderCompanyId: string | null;
  receiverCompanyId: string | null;

  reason: string | null;
  remarks: string | null;

  // null/undefined: preserve existing records during update
  // []: remove all existing records
  dormaItems?: RMAItemRequest[] | null;
  dormaProofImages?: DORMAProofImageRequest[] | null;
}

export interface UpdateDeliveryOrderRMARequest extends CreateDeliveryOrderRMARequest {
  id: string;
}

export interface RMAItemRequest {
  salesOrderItemId?: string | null;
  deliveryOrderItemId?: string | null;

  description: string | null;
  quantity: number | null;
  unit: string | null;
  condition: string | null;
  remarks: string | null;
}

export interface DORMAProofImageRequest {
  url: string;
}

export interface DORMAProofImage {
  id: string;
  deliveryOrderRMAId: string;
  deliveryOrderRMA?: DeliveryOrderRMA;
  url: string;
}

export interface UpdateRMAStatusRequest {
  status: string;
  remarks?: string | null;
  signatureImage?: string | null;
}

export interface DORMAStatusHistory {
  id: string;
  rmaId: string;
  deliveryOrderRMA?: DeliveryOrderRMA;

  status: string;
  actionAt: Date | string;
  actionUserId: string | null;
  remarks: string | null;
}

export interface DORMADropdownDto {
  deliveryOrders: DODropdownDto[];
  projects: ProjectDropdownDto[];
  companies: CompanyDropdownItem[];
  users: UserDto[];
}
