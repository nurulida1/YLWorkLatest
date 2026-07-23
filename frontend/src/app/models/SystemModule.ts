import { BaseModel } from './BaseModel';

export interface SystemModuleDto extends BaseModel {
  name: string;
  code: string;
  routePrefix?: string | null;
}

export interface CreateSystemModuleRequest {
  name: string;
  code: string | null;
  routePrefix?: string | null;
}

export interface UpdateSystemModuleRequest extends CreateSystemModuleRequest {
  id: string;
}
