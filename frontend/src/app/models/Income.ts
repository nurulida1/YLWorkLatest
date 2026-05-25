import { BaseModel } from './BaseModel';

export interface IncomeDto extends BaseModel {
  incomeNo: string;
  amount: number;
  incomeDate: Date;
  paymentMode: string;
  description: string;
  attachment: string;
}

export interface CreateIncomeRequest {
  incomeNo: string;
  amount: number;
  incomeDate: Date;
  paymentMode: string;
  description: string;
}
