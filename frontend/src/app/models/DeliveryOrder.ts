import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { ProjectDto } from './Project';
import { PurchaseOrderDto } from './PurchaseOrder';
import { SalesOrderDto, SalesOrderItem } from './SalesOrder';
import { UserDto } from './User';

export interface DeliveryOrderDto extends BaseModel {
  deliveryOrderNo: string;

  projectId?: string;
  project?: ProjectDto;

  salesOrderId?: string;
  salesOrder?: SalesOrderDto;

  senderCompanyId?: string;
  senderCompany?: CompanyDto;

  receiverCompanyId?: string;
  receiverCompany?: CompanyDto;

  deliveryMethod?: string;
  estimatedDeliveryDate: Date;

  contactPerson1: string;
  contactPerson2: string;
  contactNo1: string;
  contactNo2: string;

  notes?: string;
  remarks?: string;

  status: string;
  attachment?: string;
  trackingNo?: string;
  deliveredAt?: Date;
  receivedBy?: string;
  isReceiverSigned: boolean;
  receiverSignatureImage?: string;

  paymentTerms?: string;

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

  salesOrderId?: string;

  senderCompanyId?: string;

  receiverCompanyId?: string;

  deliveryMethod?: string;

  contactPerson1: string;
  contactPerson2: string;
  contactNo1: string;
  contactNo2: string;

  remarks?: string;
  paymentTerms?: string;

  notes?: string;
  attachment?: string;
  deliveryOrderItems: CreateDeliveryOrderItemRequest[];
}

export interface CreateDeliveryOrderItemRequest {
  description?: string;

  salesOrderItemId?: string;

  quantityOrdered?: number;

  quantityDelivered?: number;

  unit?: string;

  remarks?: string;
}

export interface DeliveryOrderItem extends BaseModel {
  deliveryOrderId: string;

  deliveryOrder?: DeliveryOrderDto;

  description?: string;

  salesOrderItemId?: string;
  salesOrderItem?: SalesOrderItem;

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

export interface BulkDOItemInput {
  salesOrderItemId: string;
  quantityToDeliver: number;
}

export interface BulkDOShipmentPayload {
  salesOrderId: string;
  deliveryMethod: string;
  estimatedDeliveryDate: Date | string;
  items: BulkDOItemInput[];
}

export interface BulkDORequest {
  deliveryOrders: BulkDOShipmentPayload[];
}
