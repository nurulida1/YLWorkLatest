import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';

export interface DeliveryOrderRMA extends BaseModel {
  deliveryOrderRMANo: string;
  deliveryOrderId: string;
  date: Date;
  returnType: string;
  returnQuantity: number;
  returnMethod: string;
  returnAction: string;

  senderCompanyId?: string;
  senderCompany?: CompanyDto;

  receiverCompanyId?: string;
  receiverCompany?: CompanyDto;

  reason: string;
  remarks: string;
  status: string;

  actionUserId: string;
  actionUserName: string;

  signatureImage: string;

  doRMAItems: DORMAItem[];
  doRMAProofImages: DORMAProofImage[];
  doRMAStatusHistories: DORMAStatusHistory[];
}

export interface DORMAItem {
  id: string;
  deliveryOrderRMAId: string;
  deliveryOrderRMA: DeliveryOrderRMA;
  salesOrderItemid: string;
  deliveryOrderItemId: string;
  description: string;
  quantity: number;
  unit: string;
  condition: string;
  remarks: string;
}

export interface CreateDeliveryOrderRMARequest {
  deliveryOrderRMANo: string;
  deliveryOrderId: string;
  date: Date;
  returnMethod: string;
  returnType: string;
  returnQuantity: number;
  returnAction: string;
  senderCompanyId?: string;
  receiverCompanyId?: string;
  reason: string;
  remarks: string;
  doRMAItems: RMAItemRequest[];
  doRMAProofImages: DORMAProofImageRequest[];
}

export interface UpdateDeliveryOrderRMARequest extends CreateDeliveryOrderRMARequest {
  id: string;
}

export interface RMAItemRequest {
  description: string;
  quantity: number;
  unit: string;
  condition: string;
  remarks: string;
}

export interface DORMAProofImageRequest {
  url: string;
}

export interface UpdateRMAItemRequest extends RMAItemRequest {
  id: string;
}

export interface DORMAProofImage {
  id: string;
  deliveryOrderRMAId: string;
  deliveryOrderRMA: DeliveryOrderRMA;
  url: string;
}

export interface UpdateRMAStatusRequest {
  status: string;
  actionUserName?: string;
  remarks?: string;
  signatureImage?: string;
}

export interface DORMAStatusHistory {
  id: string;
  rmaId: string;
  status: string;
  actionAt: Date;
  actionUserId: string;
  remarks: string;
}
