import { UserRole } from '../shared/enum/enum';
import { BaseModel } from './BaseModel';
import { DepartmentDto } from './Department';

// ==========================================
// USER DTO
// ==========================================

export interface UserDto extends BaseModel {
  fullName: string;
  displayName: string;
  email: string;
  contactNo: string;

  departmentIds: string[];
  departments: DepartmentDto[];

  joinedDate: Date;
  accessPermission: string;
  employeeNo: string;
  jobTitle: string;
  systemRole: string;

  lastLoginAt: Date;
  isActive: boolean;
  hodIds: string[];

  gender: string;
  status: string;

  monthlySalary?: number | null;

  workStartTime?: string | null;
  workEndTime?: string | null;

  usesRestDayHalfDay?: boolean | null;
  restDayHalfDayStart?: string | null;
  restDayHalfDayEnd?: string | null;
}

// ==========================================
// LOGIN REQUEST
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

// ==========================================
// REGISTER REQUEST
// ==========================================

export interface RegisterRequest {
  fullName: string;
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNo: string;
  jobTitle: string;
  gender: string;
  joinedDate: Date;
  hodIds: string[];
  departmentIds: string[];
}

// ==========================================
// FORGOT PASSWORD REQUEST
// ==========================================

export interface ForgotPasswordRequest {
  email: string;
}

// ==========================================
// RESET PASSWORD REQUEST
// ==========================================

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ==========================================
// CHANGE PASSWORD REQUEST
// ==========================================

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ==========================================
// LOGIN RESPONSE
// ==========================================

export interface LoginResponse {
  success: boolean;
  message: string;

  userId: string;
  email: string;
  fullName: string;
  displayName: string;
  employeeNo: string;

  accessToken: string;
  refreshToken: string;
  expiresAt?: string;

  systemRole: UserRole | string;
  jobTitle?: string;

  departmentIds: string[];
  departments: string[];

  gender?: string;
  hodIds?: string[];
}

// ==========================================
// REFRESH TOKEN REQUEST
// ==========================================

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ==========================================
// REFRESH TOKEN RESPONSE
// ==========================================

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// ==========================================
// UPDATE USER REQUEST
// ==========================================

export interface UpdateUserRequest {
  id: string;

  fullName?: string;
  displayName?: string;
  email?: string;
  contactNo?: string;

  jobTitle?: string;
  systemRole?: string;
  joinedDate?: Date;

  hodIds?: string[];
  gender?: string;

  departmentIds?: string[];

  monthlySalary?: number | null;

  workStartTime?: string | null;
  workEndTime?: string | null;

  usesRestDayHalfDay?: boolean | null;
  restDayHalfDayStart?: string | null;
  restDayHalfDayEnd?: string | null;

  clearWorkScheduleOverride?: boolean;
}

// ==========================================
// STAFF DASHBOARD
// ==========================================

export interface StaffDashboard {
  totalStaff: number;
  activeNow: number;
  inactive: number;
  departmentDistribution: DepartmentDistribution[];
}

// ==========================================
// DEPARTMENT DISTRIBUTION
// ==========================================

export interface DepartmentDistribution {
  departmentId: string;
  department: string;
  count: number;
}
