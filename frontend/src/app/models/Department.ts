import { BaseModel } from './BaseModel';
import { UserDto } from './User';

export interface DepartmentDto extends BaseModel {
  name: string;
  hodId: string;
  hod: UserDto;
  status: string;
  users: UserDto[];
}

export interface CreateDepartmentRequest {
  name: string;
  hodId?: string;
  status: string;
}

export interface UpdateDepartmentRequest extends CreateDepartmentRequest {
  id: string;
}
