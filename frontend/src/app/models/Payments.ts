import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';
import { InvoiceDto } from './Invoice';
import { UserDto } from './User';

export interface PaymentDto extends BaseModel {
  paymentNo: string;
  clientId: string;
  client: CompanyDto;
  supplierId: string;
  supplier: CompanyDto;
  invoiceId: string;
  invoice: InvoiceDto;
  referenceNo: string;
  paymentDate: Date;
  paymentMode: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  notes: string;
  attachment: string;
  status: string;
  processedById: string;
  processedBy: UserDto;
}

export interface CreatePaymentRequest {
  paymentNo: string;
  clientId: string;
  supplierId: string;
  invoiceId: string;
  referenceNo: string;
  paymentDate: Date;
  paymentMode: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  notes: string;
  attachment: string;
}
