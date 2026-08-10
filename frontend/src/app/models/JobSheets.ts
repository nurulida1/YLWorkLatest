import { BaseModel } from './BaseModel';
import { AttachmentDto, ProjectDto } from './Project';
import { ProjectTaskDto } from './ProjectTask';
import { UserDto } from './User';

export interface JobSheetDto extends BaseModel {
  jobSheetNo: string;
  projectId: string;
  project: ProjectDto;
  projectTaskId: string;
  projectTask: ProjectTaskDto;
  workDate: Date;
  startTime?: Date;
  endTime?: Date;
  workDescription: string;
  status: string;
  members: JobSheetMember[];
  attachments: AttachmentDto[];
}

export interface JobSheetMember {
  id: string;
  jobSheetId: string;
  jobSheet: JobSheetDto;
  userId: string;
  user: UserDto;
  hoursWorked: number;
  isLeader: boolean;
}

export interface CreateJobSheetRequest {
  jobSheetNo: string;
  projectId: string;
  projectTaskId: string;
  workDate: Date;
  startTime?: Date;
  endTime?: Date;
  workDescription: string;
  status: string;
  members: CreateJobSheetMemberRequest[];
  files: File[];
}

export interface CreateJobSheetMemberRequest {
  userId: string;
  hoursWorked: number;
  isLeader: boolean;
}

export interface UpdateJobSheetRequest {
  id: string;
  jobSheetNo: string;
  projectId: string;
  projectTaskId: string;
  workDate: Date;
  startTime?: Date;
  endTime?: Date;
  workDescription: string;
  status: string;
  members: UpdateJobSheetMemberRequest[];
  files: File[];
}

export interface UpdateJobSheetMemberRequest {
  id: string;
  userId: string;
  hoursWorked: number;
  isLeader: boolean;
}

export interface UpdateJobSheetStatusRequest {
  jobSheetId: string;
  status: string;
}
