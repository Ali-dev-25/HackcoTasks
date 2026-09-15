import { Category, SubTask, Task, UserSettings } from '../types';
import { defaultCategories, getInitialSampleTasks } from '../data/sampleData';
import { calculateNextOccurrence } from './recurrence';

const TASKS_KEY = 'taskflow_tasks_v2';
const CATEGORIES_KEY = 'taskflow_categories_v2';
const SETTINGS_KEY = 'taskflow_settings_v2';

export class StorageService {
  private static listeners: (() => void)[] = [];

  public static subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify() {
    this.listeners.forEach(l => l());
  }

  public static getCategories(): Category[] {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      this.setCategories(defaultCategories);
      return defaultCategories;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return defaultCategories;
    }
  }

  public static setCategories(categories: Category[]) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    this.notify();
  }

  public static addCategory(category: Category) {
    const list = this.getCategories();
    list.push(category);
    this.setCategories(list);
  }

  public static updateCategory(category: Category) {
    const list = this.getCategories().map(c => (c.id === category.id ? category : c));
    this.setCategories(list);
  }

  public static deleteCategory(categoryId: string): { success: boolean; reason?: string } {
    const tasks = this.getTasks();
    const inUse = tasks.some(t => t.categoryId === categoryId);
    if (inUse) {
      return { success: false, reason: 'categoryInUseError' };
    }
    const list = this.getCategories().filter(c => c.id !== categoryId);
    this.setCategories(list);
    return { success: true };
  }

  public static getTasks(): Task[] {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      const initial = getInitialSampleTasks();
      this.setTasks(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static setTasks(tasks: Task[]) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    this.notify();
  }

  public static saveTask(task: Task) {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = { ...task, updatedAt: Date.now() };
    } else {
      tasks.unshift({ ...task, createdAt: Date.now(), updatedAt: Date.now() });
    }
    this.setTasks(tasks);
  }

  public static deleteTask(taskId: string) {
    const tasks = this.getTasks().filter(t => t.id !== taskId);
    this.setTasks(tasks);
  }

  public static toggleTaskComplete(taskId: string, isCompleted: boolean) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = isCompleted ? 'COMPLETED' : 'PENDING';
    task.completedAt = isCompleted ? Date.now() : undefined;
    task.updatedAt = Date.now();

    // If completed and recurring, spawn the next occurrence
    if (isCompleted && task.recurrence.type !== 'NONE') {
      const nextDate = calculateNextOccurrence(task.date, task.recurrence);
      if (nextDate) {
        const nextSubtasks: SubTask[] = task.subtasks.map((s, idx) => ({
          id: 'sub-' + Date.now() + '-' + idx,
          taskId: 'task-' + (Date.now() + 1),
          title: s.title,
          isCompleted: false,
          orderIndex: s.orderIndex
        }));

        const nextTask: Task = {
          ...task,
          id: 'task-' + (Date.now() + 1),
          date: nextDate,
          status: 'PENDING',
          completedAt: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          subtasks: nextSubtasks
        };
        tasks.push(nextTask);
      }
    }

    this.setTasks(tasks);
  }

  public static rescheduleTask(taskId: string, newDate: string, newStartTime?: string, newEndTime?: string) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.date = newDate;
    if (newStartTime) task.startTime = newStartTime;
    if (newEndTime) task.endTime = newEndTime;
    task.updatedAt = Date.now();
    this.setTasks(tasks);
  }

  public static getSettings(): UserSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const defaults: UserSettings = {
      themeMode: 'SYSTEM',
      language: 'ar',
      notificationsEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      defaultDurationMinutes: 60,
      firstDayOfWeek: 6 // السبت
    };
    if (!raw) return defaults;
    try {
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  }

  public static updateSettings(settings: UserSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    this.notify();
  }

  public static loadSampleData() {
    const samples = getInitialSampleTasks();
    this.setTasks(samples);
  }

  public static clearSampleData() {
    this.setTasks([]);
  }

  public static exportBackup(): string {
    const data = {
      tasks: this.getTasks(),
      categories: this.getCategories(),
      settings: this.getSettings(),
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  public static importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.tasks)) {
        this.setTasks(data.tasks);
      }
      if (Array.isArray(data.categories)) {
        this.setCategories(data.categories);
      }
      if (data.settings && typeof data.settings === 'object') {
        this.updateSettings(data.settings);
      }
      return true;
    } catch {
      return false;
    }
  }
}
