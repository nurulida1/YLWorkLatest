import { BaseModel } from './BaseModel';
import { AttachmentDto } from './AttachmentDto';
import { ProjectDto } from './Project';
import { UserDto } from './User';
import { StaffTaskDto } from './StaffTask';

export interface WorkOrderDto extends BaseModel {
  workOrderNo: string;
  projectId: string;
  project?: ProjectDto;

  projectCode?: string;
  projectTitle?: string;

  title: string;
  description?: string;
  workType: string;
  priority: string;
  status: string;

  location?: string;
  scopeOfWork?: string;
  remarks?: string;

  scheduledDate?: Date;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;

  assignedToId?: string;
  assignedTo?: UserDto | null;

  workOrderMembers: WorkOrderMemberDto[];
  checklists: WorkOrderChecklistDto[];
  attachments: AttachmentDto[];

  // Staff Tasks linked to this Work Order
  staffTasks?: StaffTaskDto[];

  // Task summary
  taskCount?: number;
  completedTaskCount?: number;
  inProgressTaskCount?: number;

  createdById: string;
  createdBy?: UserDto;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WorkOrderMemberDto extends BaseModel {
  workOrderId: string;
  userId: string;
  user?: UserDto;
  name?: string;
  assignedAt: Date;
  assignedById?: string;
}

export interface WorkOrderChecklistDto extends BaseModel {
  workOrderId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: Date;
  sequence: number;
}

export interface CreateWorkOrderChecklistRequest {
  title: string;
  sequence: number;
}

export interface CreateWorkOrderRequest {
  projectId: string;
  title: string;
  description?: string;
  workType: string;
  priority: string;
  status?: string;
  location?: string;
  scopeOfWork?: string;
  remarks?: string;
  scheduledDate?: Date | string | null;
  dueDate?: Date | string | null;
  assignedToId?: string | null;
  workOrderMembers?: string[];
  checklists?: CreateWorkOrderChecklistRequest[];
  files?: File[];
}

export interface UpdateWorkOrderRequest extends CreateWorkOrderRequest {
  id: string;
}

export interface UpdateWorkOrderStatusRequest {
  workOrderId: string;
  status: string;
}

export interface UpdateWorkOrderChecklistStatusRequest {
  id: string;
  isCompleted: boolean;
}

export interface WorkOrderDropdownDto {
  projects: {
    id: string;
    projectCode: string;
    projectTitle: string;
    location: string;
    projectLeaderId: string | null;
    projectLeaderName: string | null;
    projectMembers: {
      userId: string;
      user: {
        id: string;
        fullName: string;
        displayName: string;
      };
    }[];
  }[];

  users: {
    id: string;
    fullName: string;
    displayName?: string;
    jobTitle?: string;
  }[];

  workTypes: string[];
  priorities: string[];
  statuses: string[];
}

export interface WorkOrderPagingContent {
  data: WorkOrderDto[];
  totalElements: number;
}
