import { BaseModel } from './BaseModel';

export interface NotificationDto extends BaseModel {
  title?: string;
  message?: string;
  type?: string;
  link?: string;
  isRead: boolean;
  userId?: string;
  createdBy?: string;
  roleId?: string;
}
