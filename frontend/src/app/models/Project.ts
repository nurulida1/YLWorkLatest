import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { PurchaseOrderDto } from './PurchaseOrder';
import { QuotationDto } from './Quotation';
import { UserDto } from './User';
import { WorkOrderDto } from './WorkOrder';

export interface ProjectDto extends BaseModel {
  projectCode: string;
  projectTitle: string;
  clientId: string;
  client: CompanyDto;
  status: string;
  startDate: Date;
  dueDate: Date;
  createdById: string;
  createdBy: UserDto;
  description: string;
  priority: string;
  projectMembers: ProjectMember[];
  workOrders: WorkOrderDto[];
  quotations: QuotationDto[];
  purchaseOrders: PurchaseOrderDto[];
}

export interface ProjectMember extends BaseModel {
  projectCode: string;
  project: ProjectDto;
  userId: string;
  user: UserDto;
  assignedAt: Date;
  assignedById: string;
  assignedBy: UserDto;
}

export interface CreateProjectRequest {
  projectCode: string;
  projectTitle: string;
  clientId: string;
  startDate: Date;
  dueDate: Date;
  description: string;
  priority: string;
  projectMembers: ProjectMemberRequest[];
}

export interface UpdateProjectRequest extends CreateProjectRequest {
  id: string;
}

export interface ProjectMemberRequest {
  userId: string;
}

export interface UpdateProjectStatusRequest {
  projectId: string;
  status: string;
}

export interface ProjectDto {
  id: string;
  projectCode: string;
  projectTitle: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  priority: string;
  clientId: string;
  client: CompanyDto;
  status: string;
  projectMembers: ProjectMember[];
}

export interface ProjectMemberDto {
  userId: string;
  user: UserDto;
}

export interface ProjectDropdownDto {
  clients: { id: string; name: string }[];
  users: { id: string; fullName: string }[];
}
