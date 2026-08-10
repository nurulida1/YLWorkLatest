import { BaseModel } from './BaseModel';
import { UserDto } from './User';

export interface StaffTask extends BaseModel {
  title: string;
  description: string;
  assignedToId: string;
  assignedTo: UserDto;
  assignedById: string;
  assignedBy: UserDto;
  priority: string;
  category: string;
  status: string;
  startDate?: Date;
  dueDate?: Date;
  reminderAt?: Date;
  isRecurring: boolean;
  recurringType?: string;
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: Date;
  checklist?: StaffTaskChecklist[];
}

export interface StaffTaskChecklist {
  id: string;
  staffTaskId: string;
  staffTask: StaffTask;
  title: string;
  isCompleted: boolean;
  completedAt?: Date;
  sequence: number;
}
