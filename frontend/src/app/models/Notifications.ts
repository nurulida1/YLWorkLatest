import { BaseModel } from './BaseModel';

export interface NotificationDto extends BaseModel {
  message?: string;
  type?: string;
  link?: string;
  isRead: boolean;
  userId?: string;
  createdBy?: string;
  roleId?: string;
}
