import { Supplier } from '../components/suppliers/supplier/supplier';
import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { PurchaseOrderDto, PurchaseOrderItem } from './PurchaseOrder';
import { UserDto } from './User';

export interface GoodsReceiving extends BaseModel {
  grnNo: string;
  purchaseOrderId: string;
  purchaseOrder: PurchaseOrderDto;
  supplierId?: string;
  supplier?: Supplier;
  receivedDate: Date;
  supplierDONo: string;
  supplierDODate: Date;
  supplierDOAttachmet: string;
  status: string;
  remarks: string;
  createdById: string;
  createdBy: UserDto;
  goodsReceivingItems: GoodsReceivingItem[];
}

export interface GoodsReceivingItem extends BaseModel {
  goodsReceivingId: string;
  goodsReceiving: GoodsReceiving;
  purchaseOrderItemId: string;
  purchaseOrderItem: PurchaseOrderItem;
  receivedQuantity: number;
  remarks: string;
}

export interface GoodsReceivingItemRequest {
  purchaseOrderItemId: string;
  receivedQuantity: number;
  remarks: string;
}

export interface CreateGoodsReceivingRequest {
  grnNo: string;
  purchaseOrderId: string;
  supplierId: string;
  receivedDate: Date;
  supplierDONo: string;
  supplierDODate: Date;
  supplierDOAttachment: string;
  remarks: string;
  goodsReceivingItems: GoodsReceivingItemRequest[];
}

export interface UpdateGoodsReceivingItemRequest {
  id: string;
  purchaseOrderItemId: string;
  receivedQuantity: number;
  remarks: string;
}

export interface UpdateGoodsReceivingRequest {
  id: string;
  grnNo: string;
  purchaseOrderId: string;
  supplierId: string;
  receivedDate: Date;
  supplierDONo: string;
  supplierDODate: Date;
  supplierDOAttachment: string;
  remarks: string;
  goodsReceivingItems: UpdateGoodsReceivingItemRequest[];
}

export interface GRNDropdownDto {
  purchaseOrders: PurchaseOrderDto[];
  suppliers: CompanyDto[];
  companies: CompanyDto[];
}
