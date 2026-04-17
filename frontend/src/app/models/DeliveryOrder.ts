import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { ProjectDto } from './Project';
import { PurchaseOrderDto } from './PurchaseOrder';
import { UserDto } from './User';

export interface DeliveryOrderDto extends BaseModel {
  deliveryOrderNo: string;
  projectCode: string;
  project: ProjectDto;
  purchaseOrderId: string;
  purchaseOrder: PurchaseOrderDto;
  referenceNo: string;
  senderCompanyId: string;
  senderCompany: CompanyDto;
  receiverCompanyId: string;
  receiverCompany: CompanyDto;
  deliveryMethod: string;
  notes: string;
  remarks: string;
  deliveryOrderStatusHistories: DeliveryOrderStatusHistory[];
  deliveryOrderItems: DeliveryOrderItem[];
  status: string;
}

export interface DeliveryOrderStatusHistory extends BaseModel {
  deliveryOrderId: string;
  deliveryOrder: DeliveryOrderDto;
  status: string;
  actionAt: Date;
  actionUserId: string;
  actionUser: UserDto;
  remarks: string;
  signatureImage: string;
  proofImageUrls: string[];
  trackingNo: string;
}

export interface CreateDeliveryOrderRequest {
  deliveryOrderNo: string;
  projectCode: string;
  referenceNo: string;
  purchaseOrderId: string;
  senderCompanyId: string;
  receiverCompanyId: string;
  deliveryMethod: string;
  remarks: string;
  notes: string;
}

export interface CreateDeliveryOrderItemRequest {
  deliveryOrderId: string;
  description: string;
  quantityOrdered: number;
  quantityDelivered: number;
  unit: string;
  remarks: string;
}

export interface DeliveryOrderItem extends BaseModel {
  deliveryOrderId: string;
  deliveryOrder: DeliveryOrderDto;
  description: string;
  quantityOrdered: number;
  quantityDelivered: number;
  unit: string;
  remarks: string;
}

export interface UpdateDeliveryOrderRequest extends CreateDeliveryOrderRequest {
  id: string;
}

export interface UpdateDeliveryOrderItemRequest extends CreateDeliveryOrderItemRequest {
  id: string;
}
