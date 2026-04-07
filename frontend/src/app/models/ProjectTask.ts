import {
  AttachmentDto,
  AttachmentUpdateRequest,
  CreateAttachmentRequest,
} from './AttachmentDto';
import { BaseModel } from './BaseModel';
import { ProjectDto } from './Project';
import { UserDto } from './User';

export interface ProjectTaskDto extends BaseModel {
  projectId: string;
  project: ProjectDto;
  taskNo: string;
  jobTitle: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  assignedUsers: UserDto[];
  priority: string;
  status: string;
  estimatedHours?: number;
  actualHours?: number;
  attachments: AttachmentDto[];
}

export interface CreateTaskRequest {
  projectId: string;
  taskNo: string;
  jobTitle: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  assignedToIds: string[];
  priority: string;
  status: string;
  estimatedHours?: number;
  actualHours?: number;
  attachments?: CreateAttachmentRequest[];
}

export interface UpdateTaskRequest {
  id: string;
  taskNo: string;
  jobTitle: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  assignedToIds: string[];
  priority: string;
  status: string;
  estimatedHours: number;
  actualHours?: number;
  attachments?: AttachmentUpdateRequest[];
}

export interface UpdateTaskStatusRequest {
  id: string;
  status: string;
}
