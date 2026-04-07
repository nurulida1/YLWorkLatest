import { BaseModel } from './BaseModel';
import { InvoiceDto } from './Invoice';
import { LeaveApplicationDto } from './LeaveApplication';
import { MaterialRequestDto } from './MaterialRequest';
import { PaymentDto } from './Payments';
import { ProjectTaskDto } from './ProjectTask';

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
  leaveApplication?: LeaveApplicationDto;
  materialRequest?: MaterialRequestDto;
  payments?: PaymentDto;
  projectTask?: ProjectTaskDto;
}

export interface CreateAttachmentRequest {
  filename: string;
  fileType: string;
  base64Data: string;
}

export interface AttachmentUpdateRequest extends CreateAttachmentRequest {
  id: string;
}
