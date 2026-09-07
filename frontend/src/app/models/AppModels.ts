import { UserRole } from '../shared/enum/enum';

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
  jobTitle: string;
  department: string;
  createdAt: string;
}

export interface ActivityLogDto {
  title: string;
  description: string;
  user: string;
  date: string;
  icon: string;
  color: string;
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
