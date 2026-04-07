import { BaseModel } from './BaseModel';
import { DepartmentDto } from './Department';
import { UserDto } from './User';

export interface EventDto extends BaseModel {
  title: string;
  description: string;
  type: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location: string;
  meetingLink: string;
  participants: string[];
  createdById: string;
  createdBy: UserDto;
  departmentId: string;
  department: DepartmentDto;
  reminder: Date;
  repeat: boolean;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  type: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location: string;
  meetingLink: string;
  participants: string[];
  departmentId: string;
  reminder: Date;
  repeat: boolean;
}

export interface UpdateEventRequest extends CreateEventRequest {
  id: string;
}
