import { BaseModel } from './BaseModel';

export interface HolidayDto extends BaseModel {
  name: string;
  startDate: Date;
  endDate: Date;
  description: string;
}

export interface CreateHolidayRequest {
  name: string;
  startDate: Date;
  endDate: Date;
  description: string;
}

export interface UpdateHolidayRequest extends CreateHolidayRequest {
  id: string;
}
