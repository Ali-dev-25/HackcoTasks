export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type ReminderOption =
  | 'NONE'
  | 'AT_TIME'
  | 'MIN_5'
  | 'MIN_10'
  | 'MIN_15'
  | 'MIN_30'
  | 'HOUR_1'
  | 'DAY_1';

export type RecurrenceType =
  | 'NONE'
  | 'DAILY'
  | 'WEEKLY'
  | 'WEEKDAY_MASK'
  | 'EVERY_N_DAYS'
  | 'EVERY_N_WEEKS'
  | 'MONTHLY'
  | 'YEARLY';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval: number;
  daysOfWeek: number[]; // 1 = Monday, 7 = Sunday
  dayOfMonth?: number;
  endDate?: string;
}

export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  orderIndex: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  colorHex: string;
  isDefault?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  priority: Priority;
  status: TaskStatus;
  categoryId?: string;
  location: string;
  notes: string;
  recurrence: RecurrenceRule;
  reminder: ReminderOption;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  subtasks: SubTask[];
}

export interface UserSettings {
  themeMode: 'LIGHT' | 'DARK' | 'SYSTEM';
  language: 'en' | 'ar';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  defaultDurationMinutes: number;
  firstDayOfWeek: number; // 1 = Monday, 7 = Sunday
}

export type TabType = 'HOME' | 'TASKS' | 'CALENDAR' | 'STATISTICS' | 'SETTINGS';

export type TaskFilterTab = 'ALL' | 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED';

export type SortOrder = 'DATE_TIME' | 'PRIORITY' | 'TITLE';
