import { BaseModel } from './BaseModel';
import { ProjectDto } from './Project';
import { ProjectTaskDto } from './ProjectTask';
import { PurchaseOrderDto } from './PurchaseOrder';

export interface DeliveryDto extends BaseModel {
  projectId?: string;
  project?: ProjectDto;
  poId?: string;
  purchaseOrder?: PurchaseOrderDto;
  taskId?: string;
  task?: ProjectTaskDto;
  deliveryDate: Date;
  deliveryMethod: string;
  status: string;
  trackingNumber?: string;
  deliveredBy?: string;
}

export interface CreateDeliveryRequest {
  projectId?: string;
  poId?: string;
  taskId?: string;
  deliveryDate: Date;
  deliveryMethod: string;
  trackingNumber?: string;
  deliveredBy?: string;
}

export interface UpdateDeliveryRequest extends CreateDeliveryRequest {
  id: number;
}
