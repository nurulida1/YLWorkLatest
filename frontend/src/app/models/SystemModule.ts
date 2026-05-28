import { BaseModel } from './BaseModel';

export interface SystemModuleDto extends BaseModel {
  name: string;
  code: string;
}

export interface CreateSystemModuleRequest {
  name: string;
  code: string | null;
}

export interface UpdateSystemModuleRequest extends CreateSystemModuleRequest {
  id: string;
}
