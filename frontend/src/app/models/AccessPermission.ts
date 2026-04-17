import { BaseModel } from './BaseModel';

export interface AccessPermissionDto extends BaseModel {
  name: string;
}

export interface CreateAccessPermissionRequest {
  name: string;
}

export interface UpdateAccessPermissionRequest {
  id: string;
  name: string;
}
