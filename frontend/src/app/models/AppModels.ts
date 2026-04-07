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
