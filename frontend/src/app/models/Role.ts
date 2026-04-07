import { BaseModel } from './BaseModel';

export interface RoleDto extends BaseModel {
  name: string;
}

export interface CreateRoleRequest {
  name: string;
}

export interface UpdateRoleRequest extends CreateRoleRequest {
  id: string;
}
