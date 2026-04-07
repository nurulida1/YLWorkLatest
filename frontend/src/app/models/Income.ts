import { BaseModel } from './BaseModel';

export interface IncomeDto extends BaseModel {
  incomeNo: string;
  referenceNo: string;
  amount: number;
  incomeDate: Date;
  paymentMode: string;
  description: string;
}

export interface CreateIncomeRequest {
  incomeNo: string;
  referenceNo: string;
  amount: number;
  incomeDate: Date;
  paymentMode: string;
  description: string;
}
