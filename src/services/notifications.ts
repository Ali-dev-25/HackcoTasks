import { ReminderOption, Task } from '../types';

export interface ActiveAlarm {
  taskId: string;
  taskTitle: string;
  timeStr: string;
  triggerTime: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private audioCtx: AudioContext | null = null;
  private alarmListeners: ((alarm: ActiveAlarm) => void)[] = [];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public subscribeAlarms(listener: (alarm: ActiveAlarm) => void) {
    this.alarmListeners.push(listener);
    return () => {
      this.alarmListeners = this.alarmListeners.filter(l => l !== listener);
    };
  }

  public notifyListeners(alarm: ActiveAlarm) {
    this.alarmListeners.forEach(l => l(alarm));
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  public hasPermission(): boolean {
    if (!('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  public playChime() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio chime unavailable', e);
    }
  }

  public triggerAlarm(task: Task, message: string = 'Task reminder') {
    this.playChime();
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    const alarmData: ActiveAlarm = {
      taskId: task.id,
      taskTitle: task.title,
      timeStr: `${task.startTime} - ${task.endTime}`,
      triggerTime: Date.now()
    };
    this.notifyListeners(alarmData);

    if (this.hasPermission()) {
      try {
        new Notification(task.title, {
          body: `${message} (${task.startTime}) - ${task.description || 'Task scheduled'}`,
          icon: '/public/assets/icon.png',
          tag: task.id
        });
      } catch (e) {
        console.warn('Notification display failed', e);
      }
    }
  }

  public getReminderMinutes(option: ReminderOption): number {
    switch (option) {
      case 'AT_TIME': return 0;
      case 'MIN_5': return 5;
      case 'MIN_10': return 10;
      case 'MIN_15': return 15;
      case 'MIN_30': return 30;
      case 'HOUR_1': return 60;
      case 'DAY_1': return 1440;
      default: return -1;
    }
  }
}
