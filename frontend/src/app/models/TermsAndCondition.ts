import { BaseModel } from './BaseModel';

export interface TermsAndConditionDto extends BaseModel {
  title: string;
  description: string;
  selected?: boolean;
}

export interface CreateTermsAndConditionRequest {
  title: string;
  description: string;
}

export interface UpdateTermsAndConditionRequest extends CreateTermsAndConditionRequest {
  id: string;
}

export interface TermItem {
  title: string;
  description?: string;
}

export interface CreateTermsAndConditionBulkRequest {
  items: TermItem[];
}
