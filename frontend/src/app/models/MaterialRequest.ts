import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { ProjectDto } from './Project';
import { PurchaseOrderDto } from './PurchaseOrder';
import { UserDto } from './User';
import { WorkOrderDto } from './WorkOrder';

export interface MaterialRequestDto extends BaseModel {
  documentNo: string;
  revNo: string;
  effDate: Date;
  requestNo: string;
  projectCode: string;
  project: ProjectDto;
  requestDate: Date;
  deliveryDate: Date;
  deliveryPlace: string;
  workOrderId: string;
  workOrder: WorkOrderDto;
  clientId: string;
  client: CompanyDto;
  supplierId: string;
  supplier: CompanyDto;
  purchaseOrderId: string;
  purchaseOrder: PurchaseOrderDto;
  status: string;
  remarks: string;
  materialRequestStatusHistories: MaterialRequestStatusHistory[];
  materialItems: MaterialItem[];
}

export interface MaterialItem extends BaseModel {
  materialRequestId: string;
  materialRequest: MaterialRequestDto;
  description: string;
  brand: string;
  unit: string;
  typeNo: string;
  quantity: number;
  requiredAt: Date;
  supplierId: string;
  supplier: CompanyDto;
  remarks: string;
}

export interface CreateMaterialRequest {
  documentNo: string;
  revNo: string;
  effDate: Date;
  requestNo: string;
  projectCode: string;
  requestDate: Date;
  deliveryDate: Date;
  deliveryPlace: string;
  workOrderId: string;
  supplierId: string;
  requestedById: string;
  purchaseOrderId: string;
  remarks: string;
  materialItems: MaterialItemRequest[];
}

export interface UpdateMaterialRequest extends CreateMaterialRequest {
  id: string;
}

export interface MaterialItemRequest {
  description: string;
  brand: string;
  unit: string;
  typeNo: string;
  quantity: number;
  requiredAt: Date;
  remarks: string;
  supplierId: string;
}

export interface MaterialItemUpdateRequest extends MaterialItemRequest {
  id: string;
}

export interface MaterialRequestDto {
  id: string;
  documentNo: string;
  revNo: string;
  effDate: Date;
  requestNo: string;
  projectCode: string;
  project: ProjectDto;
  requestDate: Date;
  deliveryDate: Date;
  deliveryPlace: string;
  workOrderId: string;
  workOrder: WorkOrderDto;
  supplierId: string;
  supplier: CompanyDto;
  requestedById: string;
  requestedBy: UserDto;
  purchaseOrderId: string;
  purchaseOrder: PurchaseOrderDto;
  remarks: string;
  materialItems: MaterialItem[];
}

export interface MaterialItemDto {
  id: string;
  description: string;
  quantity: number;
  brand: string;
  typeNo: string;
  supplierId: string;
  unit: string;
  requiredAt: Date;
  remarks: string;
}

export interface MaterialRequestStatusHistory extends BaseModel {
  materialRequestId: string;
  materialRequest: MaterialRequestDto;
  status: string;
  actionAt: Date;
  actionUserId: string;
  actionUserName: string;
  remarks: string;
  signatureImage: string;
  proofImageUrls: string[];
}

export interface MaterialRequestStatusUpdate {
  status: string;
  actionUserId: string;
  actionUserName: string;
  remarks: string;
  signatureImage: string;
  proofImageUrls: string[];
}

export interface MaterialRequestStatusUpdateRequest {
  materialRequestId: string;
  statusUpdate: MaterialItemUpdateRequest;
}

export interface MaterialRequestStatusUpdateDto {
  id: string;
  materialRequestId: string;
  status: string;
  actionAt: Date;
  actionUserId: string;
  actionUserName: string;
  remarks: string;
  signatureImage: string;
  proofImageUrls: string[];
}
