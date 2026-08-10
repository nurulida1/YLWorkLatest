import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { JobSheetDto } from './JobSheets';
import { MaterialRequestDto } from './MaterialRequest';
import { ProjectTaskDto } from './ProjectTask';
import { PurchaseOrderDto } from './PurchaseOrder';
import { QuotationDto } from './Quotation';
import { UserDto } from './User';
import { WorkOrderDto } from './WorkOrder';

export interface ProjectDto extends BaseModel {
  id: string;

  projectCode: string;

  projectTitle: string;

  clientId: string;

  client: CompanyDto;

  status: string;

  startDate: Date;

  endDate: Date;

  estimatedCompletedDate: Date;

  estimatedBudget: number;

  location: string;

  dueDate: Date;

  createdById: string;

  createdBy: UserDto;

  description: string;

  priority: string;

  projectLeaderId: string;

  projectLeader: UserDto;

  projectMembers: ProjectMember[];

  workOrders: WorkOrderDto[];

  quotations: QuotationDto[];

  purchaseOrders: PurchaseOrderDto[];

  materialRequests: MaterialRequestDto[];

  projectTasks: ProjectTaskDto[];
  jobSheets?: JobSheetDto[];
  attachments: AttachmentDto[];
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

export interface AttachmentDto {
  id: string;

  fileName: string;

  fileType: string;

  fileSize: number;

  fileUrl: string;

  uploadedAt: Date;

  uploadedById?: string;
}

export interface CreateProjectRequest {
  projectCode: string;

  projectTitle: string;

  clientId: string;

  startDate: Date;

  estimatedCompletedDate: Date;

  estimatedBudget: number;

  location: string;

  description: string;

  priority: string;

  status: string;

  projectLeaderId: string;

  projectMembers: ProjectMemberRequest[];

  // NEW
  files?: File[];
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

export interface ProjectMemberDto {
  userId: string;

  user: UserDto;
}

export interface ProjectDropdownDto {
  clients: {
    id: string;
    name: string;
  }[];

  users: {
    id: string;
    fullName: string;
  }[];
}
