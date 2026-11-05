export interface DailyReportAttachment {
  id: string;
  dailyReportId: string;

  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  fileSize: number;

  uploadedById: string;
  uploadedByName?: string | null;

  uploadedAt: string;
}
