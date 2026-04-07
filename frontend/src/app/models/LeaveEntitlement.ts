import { BaseModel } from './BaseModel';
import { UserDto } from './User';

export interface LeaveEntitlementDto extends BaseModel {
  userId: string;
  user: UserDto;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  carriedForwardDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface CreateLeaveEntitlementRequest {
  userId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  carriedForwardDays: number;
  usedDays: number;
}

export interface UpdateLeaveEntitlementRequest extends CreateLeaveEntitlementRequest {
  id: string;
}
