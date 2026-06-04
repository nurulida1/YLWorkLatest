import { BaseModel } from './BaseModel';
import { CompanyDto } from './Company';

export interface PurchaseOrderRMA extends BaseModel {
  purchaseOrderRMANo: string;
  purchaseOrderId: string;
  goodsReceivingId: string;
  date: Date;
  returnType: string;
  returnQuantity: number;
  returnAction: string;
  returnMethod: string;
  senderCompanyId: string;
  senderCompany: CompanyDto;
  receiverCompanyId: string;
  receiverCompany: CompanyDto;
  reason: string;
  remarks: string;
  status: string;
  actionUserId: string;
  actionUserName: string;
  signatureImage: string;
  poRMAItems: PORMAItem[];
  poRMAProofImages: PORMAProofImage[];
}

export interface PORMAItem {
  id: string;
  purchaseOrderRMAId: string;
  purchaseOrderRMA: PurchaseOrderRMA;
  purchaseOrderItemId: string;
  goodsReceivedItemId: string;
  description: string;
  quantity: number;
  unit: string;
  condition: string;
  remarks: string;
}

export interface CreatePurchaseOrderRMARequest {
  purchaseOrderRMANo: string;
  purchaseOrderId: string;
  goodsReceivingId: string;
  date: Date;
  returnType: string;
  returnQuantity: number;
  returnAction: string;
  returnMethod: string;
  senderCompanyId: string;
  receiverCompanyId: string;
  reason: string;
  remarks: string;
  poRMAItems: PORMAItemRequest[];
  poRMAProofImages: PORMAProofImageRequest[];
}

export interface UpdatePurchaseOrderRMARequest extends CreatePurchaseOrderRMARequest {
  id: string;
  poRMAItems: UpdatePORMAItemRequest[];
}

export interface PORMAItemRequest {
  purchaseOrderItemId: string;
  goodsReceivedItemId: string;
  description: string;
  quantity: number;
  unit: string;
  condition: string;
  remarks: string;
}

export interface UpdatePORMAItemRequest extends PORMAItemRequest {
  id: string;
}

export interface PORMAProofImage {
  id: string;
  purchaseOrderRMAId: string;
  purchaseOrderRMA: PurchaseOrderRMA;
  url: string;
}

export interface PORMAProofImageRequest {
  url: string;
}
