import { UserRole } from '../shared/enum/enum';
import { BaseModel } from './BaseModel';
import { DepartmentDto } from './Department';

export interface UserDto extends BaseModel {
  fullName: string;
  displayName: string;
  email: string;
  contactNo: string;
  password: string;

  departmentIds: string[];
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

export interface LoginRequest {
  email: string;
  password: string;
}

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
  hodId: string;

  departmentIds: string[];
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

export interface LoginResponse {
  success: boolean;
  message: string;
  email: string;
  fullName: string;
  displayName: string;
  employeeNo: string;
  accessToken: string;
  refreshToken: string;
  expiresAt?: Date;
  userId: string;
  systemRole: UserRole | string;
  jobTitle?: string;

  departmentIds: string[];
  departments: DepartmentDto[];
}

export interface UpdateUserRequest {
  id: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  contactNo?: string;
  jobTitle?: string;
  systemRole?: string;
  joinedDate?: Date;
  hodId?: string;
  gender?: string;

  departmentIds?: string[];
}
