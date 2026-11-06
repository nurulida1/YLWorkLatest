import { Department } from '../components/company-management/department/department';
import { UserRole } from '../shared/enum/enum';
import { UserDto } from './User';

export interface DashboardSummary {
  success: boolean;
  summary: {
    quotations: {
      pending: number;
      approved: number;
      rejected: number;
    };
    jobs: {
      wip: number;
      onHold: number;
      pending: number;
    };
    workOrders: {
      total: number;
      wip: number;
      pending: number;
      onHold: number;
      completed: number;
    };
    roleRequests: {
      pending: number;
      approved: number;
      rejected: number;
    };
  };
  roleRequestsDetails: RoleRequestDetails[];
}

export interface RoleRequestDetails {
  id: string;
  requestedRole: UserRole;
  status: string;
  userFullName: string;
  createdAt: Date;
}

export interface DashboardCount {
  quotations: {
    pending: number;
    approved: number;
    rejected: number;
  };
  jobs: {
    active: number;
    delayed: number;
    pending: number;
  };
  workOrders: number;
}

export interface SuperAdminDashboardDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingApprovals: number;
  totalDepartments: number;
  totalInventoryItems: number;
  lowStockItems: number;
  faultyItems: number;
  pendingUsers: PendingUserDto[];
  activities: ActivityLogDto[];
}

export interface PendingUserDto {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  jobTitle: string;
  department: Department[];
  createdAt: string;
}

export interface ActivityLogDto {
  id: string;
  title: string;
  description: string;
  user: string;
  date: string;
  icon: string;
  color: string;
  actionAt: Date;
  createdAt: Date;
  actionUser: UserDto;
}

export interface HrDepartmentDistribution {
  departmentId: string;
  department: string;
  count: number;
}

export interface HrTodayLeaveEvent {
  requestId: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  leaveTypeId?: string;
  leaveTypeName?: string;
  reason?: string;
  totalDays?: number;
  startSession?: string;
  endSession?: string;
  canViewDetails: boolean;
}

export interface HrDashboardDto {
  totalEmployees: number;
  pendingLeave: number;
  onLeaveToday: number;
  assumedPresentToday: number;
  resignedStaff: number;
  newStaffUnderOneYear: number;
  departmentDistribution: HrDepartmentDistribution[];
  todayLeaveEvents: HrTodayLeaveEvent[];
}

export interface TeamAbsence {
  employeeId: string;
  employeeName: string;
  department: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
}

export interface TodayMeetingParticipant {
  userId: string;
  fullName: string;
  hasAccepted: boolean;
  hasJoined: boolean;
}

export interface TodayMeeting {
  id: string;
  title: string;
  description?: string;
  meetingDate: string;
  meetingTime: string | null;
  location?: string;
  meetingLink?: string;
  meetingMethod?: string;
  organizerId: string;
  organizerName: string;
  participants: TodayMeetingParticipant[];
}

export interface TodayMeetingsResponse {
  success: boolean;
  data: {
    date: string;
    totalMeetings: number;
    meetings: TodayMeeting[];
  };
}
