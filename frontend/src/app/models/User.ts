import { UserRole } from '../shared/enum/enum';
import { BaseModel } from './BaseModel';
import { DepartmentDto } from './Department';

export interface UserDto extends BaseModel {
  departmentId: string;
  department: DepartmentDto;
  employeeId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  contactNo: string;
  passwordHash: string;
  jobTitle: string;
  joinDate: Date;
  role: string;
  lastLoginAt: Date;
  isActive: boolean;
  refreshToken: string;
  refreshTokenExpiryTime: Date;
}

// Login & Auth Requests
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNo?: string;
  role?: UserRole | string;
  jobTitle?: string;
  isActive: boolean;
}

export interface UpdateUserRequest {
  id: string; // The Guid of the user
  firstName?: string;
  lastName?: string;
  contactNo?: string;
  jobTitle?: string;
  role?: string;
  isActive?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  userId: string;
  newPassword: string;
  confirmPassword: string;
}

// Login Response
export interface LoginResponse {
  success: boolean;
  message: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt?: Date;
  userId: string;
  role: UserRole | string;
  jobTitle?: string;
  department: string;
}

// Optional: Credential model
export interface UserCredential {
  username: string;
  password: string;
}

// Update User Request
export interface UpdateUserRequest {
  userId: string; // <--- Added userId
  fullName?: string;
  email?: string;
  role?: UserRole | string;
  supervisorId: string;
  position?: string;
  totalAL?: number;
  balanceAL?: number;
  usedAL?: number;
  totalMC?: number;
  balanceMC?: number;
  usedMC?: number;
  usedOther?: number;
}
