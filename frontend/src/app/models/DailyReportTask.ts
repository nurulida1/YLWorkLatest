export interface DailyReportTask {
  id: string;
  dailyReportId: string;

  title: string;
  description?: string | null;

  startTime?: string | null;
  endTime?: string | null;

  status: DailyReportTaskStatus;
  remarks?: string | null;

  createdAt: string;
  updatedAt?: string | null;
}

export type DailyReportTaskStatus =
  | 'Pending'
  | 'InProgress'
  | 'Completed'
  | 'OnHold';

export interface CreateDailyReportTaskRequest {
  title: string;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status: DailyReportTaskStatus;
  remarks?: string | null;
}

export interface UpdateDailyReportTaskRequest {
  id?: string | null;
  title: string;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status: DailyReportTaskStatus;
  remarks?: string | null;
}
