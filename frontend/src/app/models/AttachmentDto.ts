import { BaseModel } from './BaseModel';
import { InvoiceDto } from './Invoice';
import { MaterialRequestDto } from './MaterialRequest';
import { PaymentDto } from './Payments';

export interface AttachmentDto extends BaseModel {
  fileName: string;
  fileType: string;
  fileData: any[];
  invoiceId?: string;
  leaveApplicationId?: string;
  materialRequestId?: string;
  paymentId?: string;
  projectTaskId?: string;
  invoice?: InvoiceDto;
  materialRequest?: MaterialRequestDto;
  payments?: PaymentDto;
}

export interface CreateAttachmentRequest {
  filename: string;
  fileType: string;
  base64Data: string;
}

export interface AttachmentUpdateRequest extends CreateAttachmentRequest {
  id: string;
}
