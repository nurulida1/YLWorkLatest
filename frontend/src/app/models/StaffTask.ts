import { BaseModel } from './BaseModel';
import { UserDto } from './User';

export interface StaffTask extends BaseModel {
  title: string;
  description?: string;
  assignedToId: string;
  assignedTo: UserDto;
  assignedById: string;
  assignedBy: UserDto;
  priority: string;
  category: string;
  status: string;
  startDate: Date;
  dueDate: Date;
  reminderAt?: Date;
  isRecurring: boolean;
  recurringType?: string;
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: Date;
  completedById?: string;
  completedBy?: UserDto;
  checklists: StaffTaskChecklist[];
}

export interface StaffTaskChecklist {
  id: string;
  staffTaskId: string;
  staffTask: StaffTask;
  title: string;
  isCompleted: boolean;
  completedAt?: Date;
  sequence?: number;
}

export interface CreateStaffTaskRequest {
  title: string;
  description?: string;
  assignedToId?: string;
  priority: string;
  category: string;
  startDate?: Date;
  dueDate: Date;
  reminderAt?: Date;
  isRecurring: boolean;
  recurringType?: string;
  estimatedHours?: number;
  checklists: CreateStaffTaskChecklistRequest[];
}

export interface CreateStaffTaskChecklistRequest {
  title: string;
  sequence: number;
}

export interface UpdateStaffTaskRequest {
  id: string;
  title: string;
  description?: string;
  assignedToId: string;
  priority: string;
  category: string;
  status: string;
  startDate?: Date;
  dueDate: Date;
  reminderAt?: Date;
  isRecurring: boolean;
  recurringType?: string;
  estimatedHours?: number;
  checklists: UpdateStaffTaskChecklistItem[];
}

export interface UpdateStaffTaskChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  sequence: number;
}

export interface UpdateChecklistOnlyRequest {
  id: string;
  checklists: UpdateChecklistOnlyItem[];
}

export interface UpdateChecklistOnlyItem {
  id: string;
  isCompleted: boolean;
  sequence: number;
}
export interface UpdateChecklistItemRequest {
  id: string;
  isCompleted: boolean;
  sequence: number;
}
export interface CompleteStaffTaskRequest {
  actualHours?: number;
}

export interface StaffTaskSummary {
  myTasks: number;
  assignedToOthers: number;
  inProgress: number;
  completed: number;
}
