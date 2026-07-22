import { Supplier } from '../components/suppliers/supplier/supplier';
import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { PurchaseOrderDto, PurchaseOrderItem } from './PurchaseOrder';
import { UserDto } from './User';

export interface GoodsReceivingDto extends BaseModel {
  grnNo: string;
  purchaseOrderId: string;
  purchaseOrder: PurchaseOrderDto;
  supplierId?: string;
  supplier?: Supplier;
  companyId?: string;
  company?: CompanyDto;
  receivedDate: Date;
  supplierDONo: string;
  supplierDODate: Date;
  supplierDOAttachment: string;
  status: string;
  remarks: string;
  gross: number;
  discount: number;
  totalAmount: number;
  createdById: string;
  createdBy: UserDto;
  isPostedToInventory: boolean;
  goodsReceivingItems: GoodsReceivingItem[];
}

export interface GoodsReceivingItem extends BaseModel {
  goodsReceivingId: string;
  goodsReceiving: GoodsReceivingDto;
  purchaseOrderItemId: string;
  purchaseOrderItem: PurchaseOrderItem;
  receivedQuantity: number;
  unitPrice: number;
  unit: string;
  totalPrice: number;
  remarks: string;
  invoiceQuantity: number;
}

export interface GoodsReceivingItemRequest {
  purchaseOrderItemId: string;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  remarks: string;
}

export interface CreateGoodsReceivingRequest {
  grnNo: string;
  purchaseOrderId: string;
  supplierId: string;
  companyId?: string;

  receivedDate: Date;
  supplierDONo: string;
  supplierDODate: Date;
  supplierDOAttachment: string;
  remarks: string;
  gross: number;
  discount: number;
  totalAmount: number;
  goodsReceivingItems: GoodsReceivingItemRequest[];
}

export interface UpdateGoodsReceivingItemRequest {
  id: string;
  purchaseOrderItemId: string;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  remarks: string;
}

export interface UpdateGoodsReceivingRequest {
  id: string;
  grnNo: string;
  purchaseOrderId: string;
  supplierId: string;
  companyId?: string;

  receivedDate: Date;
  supplierDONo: string;
  supplierDODate: Date;
  supplierDOAttachment: string;
  remarks: string;
  gross: number;
  discount: number;
  totalAmount: number;
  goodsReceivingItems: UpdateGoodsReceivingItemRequest[];
}

export interface GRNDropdownDto {
  purchaseOrders: PurchaseOrderDto[];
  suppliers: CompanyDto[];
  companies: CompanyDto[];
}

export interface CreateInvoiceFromGRNItemsRequest {
  supplierId: string;
  items: CreateInvoiceItemFromGRN[];
}

export interface CreateInvoiceItemFromGRN {
  goodsReceivingItemId: string;
  quantity: number;
}
