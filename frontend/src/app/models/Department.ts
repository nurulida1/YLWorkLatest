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
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  hodId?: string;
}

export interface UpdateDepartmentRequest extends CreateDepartmentRequest {
  id: string;
}
