import { BaseModel } from './BaseModel';

export interface ExpenseDto extends BaseModel {
  expenseNo: string;
  amount: number;
  expenseDate: Date;
  paymentMode: string;
  description: string;
  attachment: string;
}

export interface CreateExpenseRequest {
  expenseNo: string;
  amount: number;
  expenseDate: Date;
  paymentMode: string;
  description: string;
}
