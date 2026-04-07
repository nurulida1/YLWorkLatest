import { BaseModel } from './BaseModel';
import { ClientDto } from './Client';
import { InvoiceDto } from './Invoice';
import { SupplierDto } from './SupplierDto';
import { UserDto } from './User';

export interface PaymentDto extends BaseModel {
  paymentNo: string;
  clientId: string;
  client: ClientDto;
  supplierId: string;
  supplier: SupplierDto;
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
