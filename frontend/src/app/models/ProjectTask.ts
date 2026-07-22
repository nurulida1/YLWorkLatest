import { BaseModel } from './BaseModel';
import { ProjectDto } from './Project';
import { UserDto } from './User';

export interface ProjectTaskDto extends BaseModel {
  taskCode: string;
  title: string;
  description: string;
  priority: string;
  estimatedStartDate: Date;
  estimatedEndDate: Date;
  projectId: string;
  project: ProjectDto;
  category: string;
  status: string;
  actualStartDate: Date;
  completedDate: Date;
  dueDate: Date;
  progress: number;
  remarks: string;
  assignedTaskMembers: ProjectTaskAssignment[];
  taskAttachments: ProjectTaskAttachment[];
  checklists: ProjectTaskChecklist[];
}

export interface ProjectTaskAssignment extends BaseModel {
  projectTaskId: string;
  projectTask: ProjectTaskDto;
  userId: string;
  user: UserDto;
  assignedDate: Date;
}

export interface ProjectTaskAttachment extends BaseModel {
  projectTaskId: string;
  projectTask: ProjectTaskDto;
  fileName: string;
  filePath: string;
  fileType: string;
  uploadedById: string;
  uploadedBy: UserDto;
  uploadedDate: Date;
}

export interface ProjectTaskChecklist extends BaseModel {
  projectTaskId: string;
  projectTask: ProjectTaskDto;
  title: string;
  isCompleted: boolean;
  completedDate: Date;
}

export interface CreateProjectTaskRequest {
  taskCode: string;
  title: string;
  description: string;
  priority: string;
  estimatedStartDate: Date;
  estimatedEndDate: Date;
  projectId: string;
  category: string;
  status: string;
  dueDate: Date;
  progress: number;
  remarks: string;
  assignedUserIds: string[];
  checklists: CreateProjectTaskChecklistRequest[];
}

export interface CreateProjectTaskChecklistRequest {
  title: string;
  isCompleted: boolean;
}

export interface UpdateProjectTaskRequest {
  id: string;
  taskCode: string;
  title: string;
  description: string;
  priority: string;
  estimatedStartDate: Date;
  estimatedEndDate: Date;
  projectId: string;
  category: string;
  status: string;
  actualStartDate: Date;
  completedDate: Date;
  dueDate: Date;
  progress: number;
  remarks: string;
  assignedUserIds: string[];
  checklists: UpdateProjectTaskChecklistRequest[];
}

export interface UpdateProjectTaskChecklistRequest {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface UploadProjectTaskAttachmentRequest {
  projectTaskId: string;
  file: File;
}

export interface ProjectTaskCount {
  totalTask: number;
  inProgress: number;
  underReview: number;
  criticalPriority: number;
}
