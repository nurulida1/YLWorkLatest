import { BaseModel } from './BaseModel';

export interface LeaveTypeDto extends BaseModel {
  name: string;
  code: string;
  requiresAttachment: boolean;
}

export interface CreateLeaveTypeRequest {
  name: string;
  code: string;
  requiresAttachment: boolean;
}

export interface UpdateLeaveTypeRequest extends CreateLeaveTypeRequest {
  id: string;
}
