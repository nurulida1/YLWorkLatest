export enum DeliveryStatus {
  Pending = 'Pending',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
}

export enum PurchaseOrderStatus {
  Draft = 'Draft',
  Partial = 'Partial',
  Received = 'Received',
  Closed = 'Closed',
  Cancelled = 'Cancelled',
}

export enum QuotationStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export enum UserRole {
  Director = 'Director',
  Manager = 'Manager',
  Admin = 'Admin',
  HR = 'HR',
  Staff = 'Staff',
  SuperAdmin = 'SuperAdmin',
}

export enum WorkOrderStatus {
  Pending = 'Pending',
  WIP = 'WIP',
  OnHold = 'OnHold',
  Completed = 'Completed',
}

export enum RoleRequestStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum JobPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum JobStatus {
  NotStarted = 'NotStarted',
  Assigned = 'Assigned',
  WIP = 'WIP',
  OnHold = 'OnHold',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum InvoiceStatus {
  Pending = 0,
  PartialPaid = 1,
  Paid = 2,
  Cancelled = 3,
}

export enum PaymentStatus {
  Pending = 0,
  Completed = 1,
  Cancelled = 2,
  Failed = 3,
}

export enum CompanyType {
  Own = 1,
  Client = 2,
  Supplier = 3,
}
