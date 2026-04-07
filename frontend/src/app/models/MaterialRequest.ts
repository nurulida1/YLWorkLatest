import { BaseModel } from './BaseModel';
import { ProjectDto } from './Project';
import { ProjectTaskDto } from './ProjectTask';
import { PurchaseOrderDto } from './PurchaseOrder';
import { SupplierDto } from './SupplierDto';
import { UserDto } from './User';

export interface MaterialRequestDto extends BaseModel {
  requestNo: string;
  projectId: string;
  project: ProjectDto;
  taskId: string;
  task: ProjectTaskDto;
  poId: string;
  clientId: string;
  purchaseOrder: PurchaseOrderDto;
  purpose: string;
  requestDate: Date;
  requestedById: string;
  requestedBy: UserDto;
  status: string;
  remarks?: string;
  approvedById: string;
  approvedBy: UserDto;
  approvalRequestedAt: Date;
  approvedAt: Date;
  rejectedAt: Date;
  issuedAt: Date;
  issuedById: string;
  completedAt: Date;
  rejectionReason: string;
  materialItems: MaterialItem[];
  attachments: string[];
}

export interface MaterialItem extends BaseModel {
  materialRequestId: string;
  materialRequest: MaterialRequestDto;
  description: string;
  brand: string;
  unit: string;
  quantity: number;
  requiredDate: Date;
  supplierId: string;
  supplier: SupplierDto;
}

export interface CreateMaterialRequest {
  requestNo: string;
  projectId: string;
  taskId?: string;
  clientId: string;
  poId: string;
  purpose: string;
  requestDate: Date;
  requestedById: string;
  remarks?: string;
  materialItems: MaterialItemRequest[];
  attachments: string[];
}

export interface UpdateMaterialRequest {
  id: string;
  requestNo: string;
  projectId?: string;
  taskId?: string;
  clientId: string;
  poId?: string;
  purpose?: string;
  requestDate?: Date;
  requestedById?: string;
  remarks?: string;
  materialItems: MaterialItemUpdateRequest[];
  attachments: string[];
}

export interface MaterialItemRequest {
  description: string;
  brand: string;
  unit: string;
  quantity?: number;
  requiredDate?: Date;
  supplierId: string;
}

export interface MaterialItemUpdateRequest extends MaterialItemRequest {
  id: string;
}

export interface UpdateMaterialRequestStatusDto {
  id: string;
  status: string;
  approvedById?: string;
  rejectionReason?: string;
}
