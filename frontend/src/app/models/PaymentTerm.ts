import { BaseModel } from './BaseModel';

export interface PaymentTermDto extends BaseModel {
  name: string;
}

export interface CreatePaymentTermRequest {
  name: string;
}

export interface UpdatePaymentTermRequest extends CreatePaymentTermRequest {
  id: string;
}
