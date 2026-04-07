import { BaseModel } from './BaseModel';
import { ClientDto } from './Client';
import { ProjectTaskDto } from './ProjectTask';
import { UserDto } from './User';

export interface ProjectDto extends BaseModel {
  projectTitle: string;
  clientId: string;
  progress: number;
  client: ClientDto;
  status: string;
  dueDate: Date;
  createdById: string;
  createdBy: UserDto;
  description: string;
  priority: string;
  projectMembers: ProjectMember[];
  tasks: ProjectTaskDto[];
}

export interface ProjectMember extends BaseModel {
  projectId: string;
  project: ProjectDto;
  userId: string;
  user: UserDto;
}

export interface CreateProjectRequest {
  projectTitle: string;
  clientId: string;
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

export interface ProjectDropdownDto {
  clients: { id: string; name: string }[];
  users: { id: string; firstName: string; lastName: string }[];
}
