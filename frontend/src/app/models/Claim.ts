export type ClaimType =
  | 'MonthlyReimbursement'
  | 'Overtime'
  | 'OutstationTravel';

export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type ClaimReimbursementCategory =
  | 'Medical'
  | 'SafetyShoes'
  | 'GeneralPurchase';

export type ClaimOtDayType = 'Normal' | 'RestDay' | 'PublicHoliday';

export type ClaimLineKind =
  | 'MonthlyItem'
  | 'OvertimeItem'
  | 'Mileage'
  | 'Expense'
  | 'MealAllowance';

export type ClaimVehicleType = 'Car' | 'Motorcycle';

export type ClaimDocumentKind = 'Receipt' | 'EInvoice';

export interface CreateClaimLineItemDto {
  lineKind: ClaimLineKind | string;
  description?: string;
  amount?: number;
  category?: ClaimReimbursementCategory | string;
  purchaseDate?: string;
  workDate?: string;
  dayType?: ClaimOtDayType | string;
  hours?: number;
  vehicleType?: ClaimVehicleType | string;
  kilometers?: number;
  mealDays?: number;
}

export interface CreateClaimRequestDto {
  employeeId: string;
  claimType: ClaimType | string;
  remarks?: string;
  destination?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  lineItems: CreateClaimLineItemDto[];
}

export interface ClaimLineItemDto {
  id: string;
  lineKind: string;
  description: string;
  amount: number;
  category?: string | null;
  purchaseDate?: string | null;
  workDate?: string | null;
  dayType?: string | null;
  hours?: number | null;
  ordinaryRate?: number | null;
  hourlyRate?: number | null;
  vehicleType?: string | null;
  kilometers?: number | null;
  mealDays?: number | null;
}

export interface ClaimDocumentDto {
  id: string;
  documentKind: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface ClaimApprovalChainStepDto {
  stepOrder: number;
  approverId?: string | null;
  approverName: string;
  status: string;
  decidedAt?: string | null;
  rejectionReason?: string | null;
  isFinalStep: boolean;
}

export interface ClaimRequestDto {
  requestId: string;
  employeeId: string;
  employeeName: string;
  claimType: string;
  status: string;
  totalAmount: number;
  remarks: string;
  submittedAt: string;
  destination?: string | null;
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  rejectionReason?: string | null;
  lineItems: ClaimLineItemDto[];
  documents: ClaimDocumentDto[];
  currentApproverIds: string[];
  currentApproverId?: string | null;
  noApproverAssigned: boolean;
  approvalChain: ClaimApprovalChainStepDto[];
}

export interface ApproveRejectClaimDto {
  approverId: string;
  rejectionReason?: string;
}

export interface CancelClaimDto {
  requestedBy: string;
}

export interface ClaimDashboardDto {
  approvedTotal: number;
  pendingTotal: number;
  approvedCount: number;
  pendingCount: number;
  recent: ClaimRequestDto[];
}

export interface ClaimSettingsDto {
  id: string;
  medicalPerReceiptLimit: number;
  medicalAnnualLimit: number;
  safetyShoesLimit: number;
  mileageCarRatePerKm: number;
  mileageMotorcycleRatePerKm: number;
  mealAllowancePerDay: number;
  ordinaryRateDivisorDays: number;
  ordinaryDayHours: number;
  otNormalMultiplier: number;
  otRestDayFirstBandMultiplier: number;
  otRestDaySecondBandMultiplier: number;
  otRestDayAfter8HourlyMultiplier: number;
  otPublicHolidayUpTo8Multiplier: number;
  otPublicHolidayAfter8HourlyMultiplier: number;
  defaultWorkStartTime: string;
  defaultWorkEndTime: string;
  defaultUsesRestDayHalfDay: boolean;
  defaultRestDayHalfDayStart: string;
  defaultRestDayHalfDayEnd: string;
}

export type UpsertClaimSettingsDto = Omit<ClaimSettingsDto, 'id'>;

export interface PreviewOtAmountDto {
  employeeId: string;
  dayType: string;
  hours: number;
}

export interface PreviewOtAmountResultDto {
  ordinaryRate: number;
  hourlyRate: number;
  amount: number;
}

export interface MedicalBalanceDto {
  year: number;
  annualLimit: number;
  usedAmount: number;
  remainingAmount: number;
  perReceiptLimit: number;
  isProrated: boolean;
}

export const CLAIM_TYPE_LABELS: Record<string, string> = {
  MonthlyReimbursement: 'Monthly Claim Reimbursement',
  Overtime: 'Overtime Claim',
  OutstationTravel: 'Outstation Travel Claim',
};
