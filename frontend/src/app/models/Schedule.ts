export interface ScheduleItem {
  id: string;
  type: 'task' | 'meeting';
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  priority?: string;
  category?: string;
  status?: string;
  meetingTime?: string;
  location?: string;
  meetingLink?: string;
}
