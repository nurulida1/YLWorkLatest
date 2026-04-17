import { BaseModel } from './BaseModel';

export interface RolePermissionDto extends BaseModel {
  systemRole: string;
  accessPermission: string;
}

export interface CreateRolePermissionRequest {
  systemRole: string;
  accessPermission: string;
}

export interface UpdateRolePermissionRequest extends CreateRolePermissionRequest {
  id: string;
}
