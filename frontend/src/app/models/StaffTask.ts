import { BaseModel } from './BaseModel';
import { UserDto } from './User';

export interface StaffTask extends BaseModel {
  title: string;
  description?: string | null;

  assignedToId?: string | null;
  assignedTo?: UserDto | null;

  assignedById: string;
  assignedBy?: UserDto | null;

  // Optional project association
  projectId?: string | null;
  project?: {
    id: string;
    projectCode: string;
    projectTitle: string;
  } | null;

  priority: string;
  category: string;
  status: string;

  startDate?: string | Date | null;
  dueDate: string | Date;
  reminderAt?: string | Date | null;

  isRecurring: boolean;
  recurringType?: string | null;

  estimatedHours?: number | null;
  actualHours?: number | null;

  completedAt?: string | Date | null;
  completedById?: string | null;
  completedBy?: UserDto | null;

  checklists: StaffTaskChecklist[];
}

export interface StaffTaskChecklist {
  id: string;
  staffTaskId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string | Date | null;
  sequence?: number;

  // Returned only if the API includes the parent task.
  staffTask?: StaffTask;
}

export interface CreateStaffTaskRequest {
  title: string;
  description?: string | null;
  assignedToId?: string | null;

  // Optional project association
  projectId?: string | null;

  priority: string;
  category: string;

  startDate?: string | Date | null;
  dueDate: string | Date;
  reminderAt?: string | Date | null;

  isRecurring: boolean;
  recurringType?: string | null;
  estimatedHours?: number | null;

  checklists: CreateStaffTaskChecklistRequest[];
}

export interface CreateStaffTaskChecklistRequest {
  title: string;
  sequence: number;
}

export interface UpdateStaffTaskRequest {
  id: string;
  title: string;
  description?: string | null;
  assignedToId?: string | null;

  // Optional project association
  projectId?: string | null;

  priority: string;
  category: string;
  status: string;

  startDate?: string | Date | null;
  dueDate: string | Date;
  reminderAt?: string | Date | null;

  isRecurring: boolean;
  recurringType?: string | null;
  estimatedHours?: number | null;

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

export interface CompleteStaffTaskRequest {
  actualHours?: number;
}

export interface StaffTaskSummary {
  myTasks: number;
  assignedToOthers: number;
  inProgress: number;
  completed: number;
}
