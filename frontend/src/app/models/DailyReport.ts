// ==========================================
// DAILY REPORT
// ==========================================
export interface DailyReport {
  id: string;

  employeeId?: string;
  employeeName?: string | null;

  projectId?: string | null;
  projectName?: string | null;

  reportDate: string;

  completedWork?: string | null;
  inProgressWork?: string | null;
  issues?: string | null;
  nextDayPlan?: string | null;

  status: string;

  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewRemarks?: string | null;

  tasks: DailyReportTaskDto[];
  attachments?: DailyReportAttachmentDto[];
  canReview?: boolean;
}

// ==========================================
// DAILY REPORT DTO
// ==========================================
export interface DailyReportDto extends DailyReport {}

// ==========================================
// CREATE DAILY REPORT REQUEST
// ==========================================
export interface CreateDailyReportRequest {
  projectId?: string | null;
  reportDate: string;

  completedWork?: string | null;
  inProgressWork?: string | null;
  issues?: string | null;
  nextDayPlan?: string | null;

  tasks: DailyReportTaskRequest[];
}

// ==========================================
// UPDATE DAILY REPORT REQUEST
// ==========================================
export interface UpdateDailyReportRequest extends CreateDailyReportRequest {
  id: string;
}

// ==========================================
// DAILY REPORT TASK REQUEST
// ==========================================
export interface DailyReportTaskRequest {
  staffTaskId: string;
  workDescription?: string | null;
  hoursSpent: number;
}

// ==========================================
// DAILY REPORT TASK DTO
// ==========================================
export interface DailyReportTaskDto {
  id: string;
  dailyReportId?: string;

  staffTaskId: string;
  taskTitle?: string | null;

  workDescription?: string | null;
  hoursSpent: number;
}

// ==========================================
// DAILY REPORT ATTACHMENT DTO
// ==========================================
export interface DailyReportAttachmentDto {
  id: string;
  dailyReportId?: string;

  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  fileSize: number;

  uploadedById?: string;
  uploadedByName?: string | null;
  uploadedAt?: string;
}

// ==========================================
// DAILY REPORT DROPDOWN
// ==========================================
export interface DailyReportDropdown {
  id: string;
  title: string;
}

// ==========================================
// DAILY REPORT RESPONSE
// ==========================================
export interface DailyReportResponse {
  message: string;
  id?: string;
}

export interface DailyReportStaffTaskDropdown {
  id: string;
  title: string;
}
