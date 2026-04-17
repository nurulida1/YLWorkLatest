import { UserRole } from '../shared/enum/enum';
import { BaseModel } from './BaseModel';
import { DepartmentDto } from './Department';

export interface UserDto extends BaseModel {
  fullName: string;
  email: string;
  contactNo: string;
  password: string;
  departmentId: string;
  departments: DepartmentDto[];
  joinedDate: Date;
  accessPermission: string;
  employeeNo: string;
  jobTitle: string;
  systemRole: string;
  lastLoginAt: Date;
  isActive: boolean;
  hodId: string;
  hod: UserDto;
  refreshToken: string;
  refreshTokenExpiryTime: Date;
  gender: string;
}

// Login & Auth Requests
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNo: string;
  jobTitle: string;
  gender: string;
  joinedDate: Date;
  hodId: string;
}

export interface UpdateUserRequest {
  id: string; // The Guid of the user
  fullName?: string;
  contactNo?: string;
  jobTitle?: string;
  gender?: string;
  employeeNo?: string;
  systemRole?: string;
  departmentId?: string;
  joinedDate?: Date;
  hodId?: string;
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
  fullName: string;
  employeeNo: string;
  accessToken: string;
  refreshToken: string;
  expiresAt?: Date;
  userId: string;
  systemRole: UserRole | string;
  jobTitle?: string;
  department: string;
}

// Update User Request
export interface UpdateUserRequest {
  id: string;
  fullName?: string;
  email?: string;
  contactNo?: string;
  jobTitle?: string;
  systemRole?: string;
  joinedDate?: Date;
  hodId?: string;
  gender?: string;
}
