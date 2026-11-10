import { BaseModel } from './BaseModel';
import { UserDto } from './User';

export interface Notice extends BaseModel {
  title: string;
  content?: string;
  publishDate: Date;
  expiryDate?: Date;
  isPinned: boolean;
  isActive: boolean;
  createdById: string;
  createdByName?: string;
  createdBy?: UserDto;
}

export interface CreateNoticeRequest {
  title: string;
  content?: string;
  publishDate?: Date;
  expiryDate?: Date;
  isPinned: boolean;
}

export interface UpdateNoticeRequest extends CreateNoticeRequest {
  id: string;
}
