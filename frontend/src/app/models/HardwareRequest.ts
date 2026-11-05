export type HardwareRequestType = 'Hardware' | 'SiteMaterial' | 'ITSupport';

export type HardwareRequestPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export type HardwareRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'PartiallyIssued'
  | 'Issued'
  | 'InProgress'
  | 'Resolved'
  | 'Cancelled';

export type HardwareRequestItemStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'PartiallyIssued'
  | 'Issued'
  | 'Cancelled';

// =====================================================
// CREATE REQUEST
// =====================================================

export interface CreateHardwareRequest {
  requestType: HardwareRequestType;
  subject: string;
  description: string;
  priority: HardwareRequestPriority;

  projectId?: string | null;
  projectName?: string | null;
  siteName?: string | null;

  location?: string | null;
  locationDetails?: string | null;

  neededBy?: string | null;

  items: CreateHardwareRequestItem[];
}

export interface CreateHardwareRequestItem {
  inventoryId?: string | null;
  itemName?: string | null;
  itemCode?: string | null;
  description?: string | null;
  unit?: string | null;
  requestedQuantity: number;
  remarks?: string | null;
}

// =====================================================
// REQUEST ITEM RESPONSE
// =====================================================

export interface HardwareRequestItem {
  id: string;
  inventoryId?: string | null;

  itemName: string;
  itemCode?: string | null;
  description?: string | null;
  unit?: string | null;

  requestedQuantity: number;
  approvedQuantity: number;
  issuedQuantity: number;
  reservedQuantity: number;

  status: HardwareRequestItemStatus;
  remarks?: string | null;

  availableStock?: number | null;
}

// =====================================================
// REQUEST RESPONSE
// =====================================================

export interface HardwareRequestDto {
  id: string;

  requestType: HardwareRequestType;
  subject: string;
  description: string;
  priority: HardwareRequestPriority;
  status: HardwareRequestStatus;

  projectId?: string | null;
  projectName?: string | null;
  siteName?: string | null;

  location?: string | null;
  locationDetails?: string | null;

  neededBy?: string | null;
  approvedAt?: string | null;
  completedAt?: string | null;

  requestedById?: string;
  requestedBy?: string | null;

  approvedBy?: string | null;

  assignedToId?: string | null;
  assignedTo?: string | null;

  adminRemarks?: string | null;
  rejectionReason?: string | null;

  items: HardwareRequestItem[];
}

// =====================================================
// APPROVE REQUEST
// =====================================================

export interface ApproveHardwareRequest {
  remarks?: string | null;
  items?: ApproveHardwareRequestItem[];
}

export interface ApproveHardwareRequestItem {
  requestItemId: string;
  approvedQuantity: number;
  remarks?: string | null;
}

// =====================================================
// REJECT REQUEST
// =====================================================

export interface RejectHardwareRequest {
  reason?: string | null;
}

// =====================================================
// ASSIGN REQUEST
// =====================================================

export interface AssignHardwareRequest {
  assignedToId: string;
}

// =====================================================
// ISSUE INVENTORY
// =====================================================

export interface IssueHardwareRequest {
  items: IssueHardwareRequestItem[];
}

export interface IssueHardwareRequestItem {
  requestItemId: string;
  issuedQuantity: number;
  remarks?: string | null;
}

// =====================================================
// UPDATE STATUS
// =====================================================

export interface UpdateHardwareRequestStatus {
  status: 'InProgress' | 'Resolved';
  remarks?: string | null;
}

// =====================================================
// API RESPONSE
// =====================================================

export interface HardwareRequestApiResponse {
  success: boolean;
  message: string;
  requestId?: string;
  status?: HardwareRequestStatus;
}
