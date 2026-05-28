import { BaseModel } from './BaseModel';

export interface RolePermissionDto extends BaseModel {
  systemRole: string;
  departmentId: string | null;
  departmentName?: string;
  systemModuleId: string;
  moduleName?: string;
  moduleKey?: string;

  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canUpdateStatus: boolean;
}

export interface CreateRolePermissionRequest {
  systemRole: string;
  departmentId: string | null;
  systemModuleId: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canUpdateStatus: boolean;
}

export interface UpdateRolePermissionRequest extends CreateRolePermissionRequest {
  id: string;
}

export interface UpsertRolePermissionDto {
  id?: string | null;
  systemRole: string;
  departmentId: string | null;
  systemModuleId: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canUpdateStatus: boolean;
}

export interface ModuleRights {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canUpdateStatus: boolean;
}
