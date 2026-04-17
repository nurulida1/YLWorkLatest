import { AttachmentDto } from './AttachmentDto';
import { BaseModel } from './BaseModel';
import { ProjectDto } from './Project';
import { UserDto } from './User';

export interface WorkOrderDto extends BaseModel {
  workOrderNo: string;
  projectId: string;
  project: ProjectDto;
  title: string;
  workOrderDate: Date;
  description: string;
  dueDate: Date;
  status: string;
  workOrderTasks: WorkOrderTaskDto[];
  workOrderAssignments: WorkOrderAssignmentDto[];
  startedAt: Date;
  onHoldAt: Date;
  completedAt: Date;
  createdById: string;
  createdBy: UserDto;
  priority: string;
}

export interface CreateWorkOrderRequest {
  workOrderNo: string;
  projectId: string;
  title: string;
  workOrderDate: Date;
  description: string;
  dueDate: Date;
  priority: string;
}

export interface UpdareWorkOrderRequest extends CreateWorkOrderRequest {
  id: string;
}

export interface UpdateWorkOrderStatusRequest {
  id: string;
  status: string;
  startedAt: Date;
  onHoldAt: Date;
  completedAt: Date;
}

export interface WorkOrderAssignmentDto extends BaseModel {
  workOrderId: string;
  workOrder: WorkOrderDto;
  userId: string;
  user: UserDto;
  role: string;
  assignedAt: Date;
}

export interface WorkOrderTaskDto extends BaseModel {
  workOrderId: string;
  workOrder: WorkOrderDto;
  taskNo: string;
  taskName: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  status: string;
  priority: string;
  assignedToId: string;
  assignedTo: UserDto;
  attachments: AttachmentDto[];
}

export interface CreateWorkOrderTask {
  workOrderId: string;
  taskNo: string;
  taskName: string;
  description: string;
  startDate: Date;
  DueDate: Date;
  assignedUsers: CreateWorkOrderTaskAssignmentRequest[];
  priority: string;
  attachments: AttachmentDto[];
}

export interface WorkOrderTaskAssignment {
  id: string;
  workOrderTaskId: string;
  workOrderTask: WorkOrderTaskDto;
  userId: string;
  user: UserDto;
  role: string;
  assignedAt: Date;
  workLoadPercentage: number;
  notes: string;
}

export interface CreateWorkOrderTaskAssignmentRequest {
  workOrderTaskId: string;
  userId: string;
  role: string;
  assignedAt: Date;
  workLoadPercentage: number;
  notes: string;
}

export interface UpdateWorkOrderTaskAssignmentRequest {
  id: string;
  workOrderTaskId: string;
  userId: string;
  role: string;
  assignedAt: Date;
  workLoadPercentage: number;
  notes: string;
}

export interface UpdateTaskStatusRequest {
  id: string;
  status: string;
  startDate: Date;
  onHoldDate: Date;
  completedAt: Date;
}
