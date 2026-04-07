import { BaseModel } from './BaseModel';
import { UserDto } from './User';

export interface AuditLog extends BaseModel {
  userId: string;
  action: string;
  entityName: string;
  entityId: string;
  details: string;
  user: UserDto;
}
