import { AttachmentDto } from './AttachmentDto';
import { BaseModel } from './BaseModel';
import { DepartmentDto } from './Department';
import { LeaveTypeDto } from './LeaveType';
import { UserDto } from './User';

export interface LeaveApplicationDto extends BaseModel {
  userId: string;
  user: UserDto;
  departmentId: string;
  department: DepartmentDto;
  leaveTypeId: string;
  leaveType: LeaveTypeDto;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: string;
  approvedById: string;
  approvedBy: UserDto;
  appliedOn: Date;
  remarks?: string;
  attachments: AttachmentDto[];
}

export interface CreateLeaveApplication {
  userId: string;
  departmentId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  remarks?: string;
  attachments: LeaveAttachmentRequest[];
}

export interface LeaveAttachmentRequest {
  fileName: string;
  fileType: string;
  fileDate: any[];
}
