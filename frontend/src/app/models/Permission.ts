import { BaseModel } from './BaseModel';
import { RoleDto } from './Role';

export interface PermissionDto extends BaseModel {
  moduleName: string;
  action: string;
  permissionRole: PermissionRole[];
}

export interface PermissionRole {
  permissionId: string;
  permission: PermissionDto;
  roleId: string;
  role: RoleDto;
}

export interface CreatePermissionRequest {
  moduleName: string;
  action: string;
  roleIds: string[];
}

export interface UpdatePermissionRequest extends CreatePermissionRequest {
  id: string;
}

export interface PermissionResponse {
  id: string;
  moduleName: string;
  action: string;
  roleIds: string[];
}
