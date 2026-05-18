import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { ProjectDto } from './Project';
import { PurchaseOrderDto } from './PurchaseOrder';
import { UserDto } from './User';

export interface DeliveryOrderDto extends BaseModel {
  deliveryOrderNo: string;

  projectId?: string;
  project?: ProjectDto;

  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrderDto;

  referenceNo?: string;

  senderCompanyId?: string;
  senderCompany?: CompanyDto;

  receiverCompanyId?: string;
  receiverCompany?: CompanyDto;

  deliveryMethod?: string;
  notes?: string;
  remarks?: string;

  type: 'Inbound' | 'Outbound';

  status: string;
  attachment?: string;
  deliveryOrderStatusHistories: DeliveryOrderStatusHistory[];

  deliveryOrderItems: DeliveryOrderItem[];
}

export interface DeliveryOrderStatusHistory extends BaseModel {
  deliveryOrderId: string;

  deliveryOrder?: DeliveryOrderDto;

  status: string;

  actionAt: Date;

  actionUserId?: string;
  actionUser?: UserDto;

  reviewByUserId?: string;
  reviewByUser?: UserDto;

  remarks?: string;

  signatureImage?: string;

  proofImages?: DeliveryOrderProofImage[];

  trackingNo?: string;
}

export interface DeliveryOrderProofImage extends BaseModel {
  deliveryOrderStatusHistoryId: string;

  imageUrl: string;

  remarks?: string;

  uploadedAt: Date;
}

export interface CreateDeliveryOrderRequest {
  deliveryOrderNo: string;

  projectId?: string;

  referenceNo?: string;

  purchaseOrderId?: string;

  senderCompanyId?: string;

  receiverCompanyId?: string;

  deliveryMethod?: string;

  remarks?: string;

  notes?: string;
  attachment?: string;
  type: 'Inbound' | 'Outbound';
}

export interface CreateDeliveryOrderItemRequest {
  deliveryOrderId?: string;

  description?: string;

  quantityOrdered?: number;

  quantityDelivered?: number;

  unit?: string;

  remarks?: string;
}

export interface DeliveryOrderItem extends BaseModel {
  deliveryOrderId: string;

  deliveryOrder?: DeliveryOrderDto;

  description?: string;

  quantityOrdered?: number;

  quantityDelivered?: number;

  unit?: string;

  remarks?: string;
}

export interface UpdateDeliveryOrderRequest extends CreateDeliveryOrderRequest {
  id: string;
}

export interface UpdateDeliveryOrderItemRequest extends CreateDeliveryOrderItemRequest {
  id: string;
}
