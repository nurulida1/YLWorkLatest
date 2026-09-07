import { BaseModel } from './BaseModel';
import { UserDto } from './User';

export interface DepartmentDto extends BaseModel {
  name: string;
  code: string;
  hodId: string;
  hod: UserDto;
  description: string;
  isActive: boolean;
  users: UserDto[];
  workStartTime?: string | null;
  workEndTime?: string | null;
  usesRestDayHalfDay?: boolean | null;
  restDayHalfDayStart?: string | null;
  restDayHalfDayEnd?: string | null;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  hodId?: string;
  workStartTime?: string | null;
  workEndTime?: string | null;
  usesRestDayHalfDay?: boolean | null;
  restDayHalfDayStart?: string | null;
  restDayHalfDayEnd?: string | null;
}

export interface UpdateDepartmentRequest extends CreateDepartmentRequest {
  id: string;
}
