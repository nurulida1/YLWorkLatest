export interface LeaveTypeDto {
  id: string;
  name: string;
  description?: string;
  isPaid: boolean;
  isEmergency: boolean;
  defaultDaysPerYear: number;
  requiresDocument: boolean;
  policyKind: string;
  applicableGender: string;
}

export interface LeaveBalanceDto {
  leaveTypeId: string;
  leaveTypeName: string;
  policyKind?: string;
  applicableGender?: string;
  year: number;
  entitledDays: number;
  tenureEntitledDays?: number;
  carriedForwardDays?: number;
  creditedDays?: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface UpsertLeaveTypeDto {
  name: string;
  description?: string;
  isPaid: boolean;
  isEmergency: boolean;
  defaultDaysPerYear: number;
  requiresDocument: boolean;
  policyKind: string;
  applicableGender: string;
}

export interface LeaveTenureBandDto {
  id?: string;
  bandKind: string;
  minYearsInclusive: number;
  maxYearsExclusive?: number | null;
  daysPerYear: number;
}

export interface LeavePolicyDto {
  id: string;
  effectiveFromYear: number;
  annualCarryForwardPercent: number;
  isActive: boolean;
  tenureBands: LeaveTenureBandDto[];
}

export interface UpsertLeavePolicyDto {
  effectiveFromYear: number;
  annualCarryForwardPercent: number;
  tenureBands: LeaveTenureBandDto[];
}

export interface CreditLeaveBalanceDto {
  employeeId: string;
  leaveTypeId: string;
  days: number;
  year?: number;
  note?: string;
}

export interface CreateLeaveRequestDto {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  isEmergency: boolean;
  isUnpaid: boolean;
  conflictOverride: boolean;
}

export type LeaveApprovalChainStatus =
  | 'Approved'
  | 'Rejected'
  | 'Pending'
  | 'Waiting'
  | 'Completed';

export interface LeaveApprovalChainStepDto {
  stepOrder: number;
  approverId?: string;
  approverName: string;
  status: LeaveApprovalChainStatus | string;
  decidedAt?: string;
  rejectionReason?: string;
  isFinalStep: boolean;
}

export interface LeaveRequestDto {
  requestId: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  isEmergency: boolean;
  isUnpaid: boolean;
  conflictOverride: boolean;
  submittedAt: string;
  conflictWarning?: string;
  remainingBalance?: number;
  balanceSufficient?: boolean;
  balanceOptions?: string[];
  rejectionReason?: string;
  documentUrl?: string;
  documentFileName?: string;
  currentApproverId?: string;
  currentApproverIds?: string[];
  noApproverAssigned?: boolean;
  approvalChain?: LeaveApprovalChainStepDto[];
}

export interface ApproveRejectLeaveDto {
  approverId: string;
  rejectionReason?: string;
}

export interface CancelLeaveDto {
  requestedBy: string;
}

export interface LeaveCalendarEventDto {
  requestId: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  leaveTypeId?: string;
  leaveTypeName?: string;
  reason?: string;
  canViewDetails: boolean;
}

export interface LeaveCalendarResponseDto {
  canViewDetails: boolean;
  events: LeaveCalendarEventDto[];
}

export interface LeaveCalendarFilters {
  departmentId?: string | null;
  leaveTypeId?: string | null;
}
