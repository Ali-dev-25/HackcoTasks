import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Maximize2,
  Code2,
  Bell,
  Clock,
  CheckCircle2,
  X,
  Volume2,
  Sparkles,
  Calendar
} from 'lucide-react';
import { Category, TabType, Task, UserSettings } from './types';
import { stringsEn, stringsAr } from './locales/strings';
import { StorageService } from './services/storage';
import { ActiveAlarm, NotificationService } from './services/notifications';
import { BottomNavigation } from './components/BottomNavigation';
import { TaskDialog } from './components/TaskDialog';
import { HomeScreen } from './screens/HomeScreen';
import { TasksScreen } from './screens/TasksScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { StatisticsScreen } from './screens/StatisticsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ProjectExplorer } from './screens/ProjectExplorer';
import { ApkExportModal } from './components/ApkExportModal';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [currentTab, setCurrentTab] = useState<TabType>('HOME');
  const [viewMode, setViewMode] = useState<'DEVICE' | 'EXPANDED'>('DEVICE');
  const [showCodeExplorer, setShowCodeExplorer] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);

  // Task Dialog state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDateForNewTask, setSelectedDateForNewTask] = useState<string | undefined>(undefined);

  // Reschedule Dialog state
  const [reschedulingTask, setReschedulingTask] = useState<Task | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  // Active alarm state
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Current system theme
  const [systemIsDark, setSystemIsDark] = useState<boolean>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Sync data from StorageService
  useEffect(() => {
    const reload = () => {
      setTasks(StorageService.getTasks());
      setCategories(StorageService.getCategories());
      setSettings(StorageService.getSettings());
    };
    reload();
    const unsubscribe = StorageService.subscribe(reload);
    return unsubscribe;
  }, []);

  // Alarm listener
  useEffect(() => {
    const notifService = NotificationService.getInstance();
    const unsubAlarms = notifService.subscribeAlarms(alarm => {
      setActiveAlarm(alarm);
    });
    return unsubAlarms;
  }, []);

  // Background reminder timer checker
  useEffect(() => {
    const interval = setInterval(() => {
      if (!settings.notificationsEnabled) return;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const currentTimeInMins = currentHours * 60 + currentMins;

      tasks.forEach(t => {
        if (t.status === 'COMPLETED' || t.date !== todayStr) return;
        const [taskH, taskM] = t.startTime.split(':').map(Number);
        const taskTimeInMins = taskH * 60 + taskM;
        const reminderOffset = NotificationService.getInstance().getReminderMinutes(t.reminder);
        if (reminderOffset >= 0) {
          const triggerMin = taskTimeInMins - reminderOffset;
          if (currentTimeInMins === triggerMin && now.getSeconds() < 10) {
            NotificationService.getInstance().triggerAlarm(t, `تنبيه مهمة: ${t.title}`);
          }
        }
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [tasks, settings.notificationsEnabled]);

  // Dark mode calculation
  const isDark = useMemo(() => {
    if (settings.themeMode === 'DARK') return true;
    if (settings.themeMode === 'LIGHT') return false;
    return systemIsDark;
  }, [settings.themeMode, systemIsDark]);

  const strings = settings.language === 'ar' ? stringsAr : stringsEn;
  const isRTL = settings.language === 'ar';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Task actions
  const handleToggleComplete = (taskId: string, isCompleted: boolean) => {
    StorageService.toggleTaskComplete(taskId, isCompleted);
    if (isCompleted) {
      showToast(strings.msgTaskSaved);
    }
  };

  const handleSaveTask = (task: Task) => {
    StorageService.saveTask(task);
    showToast(strings.msgTaskSaved);
  };

  const handleDeleteTask = (taskId: string) => {
    StorageService.deleteTask(taskId);
    showToast(strings.msgTaskDeleted);
  };

  const handleSnooze = (task: Task) => {
    showToast(strings.msgSnoozed);
    NotificationService.getInstance().playChime();
    setActiveAlarm(null);
  };

  const handleReschedule = (task: Task) => {
    setReschedulingTask(task);
    setRescheduleDate(task.date);
  };

  const handleConfirmReschedule = () => {
    if (reschedulingTask && rescheduleDate) {
      StorageService.rescheduleTask(reschedulingTask.id, rescheduleDate);
      setReschedulingTask(null);
      showToast(strings.msgTaskSaved);
    }
  };

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setSelectedDateForNewTask(undefined);
    setIsTaskDialogOpen(true);
  };

  const handleOpenCreateForDate = (dateStr: string) => {
    setEditingTask(null);
    setSelectedDateForNewTask(dateStr);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedDateForNewTask(task.date);
    setIsTaskDialogOpen(true);
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hackcotasks-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل النسخة الاحتياطية بنجاح');
  };

  const handleImportBackup = (jsonString: string): boolean => {
    const ok = StorageService.importBackup(jsonString);
    if (ok) showToast('تمت استعادة البيانات بنجاح');
    return ok;
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Application Bar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl px-4 py-2.5 flex items-center justify-between transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-white/90 border-slate-200/80 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 font-black text-sm tracking-tighter">
            HT
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight flex items-center gap-2">
              <span>HackcoTasks</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                أندرويد أصلي (Native)
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Kotlin • Jetpack Compose • Room • Material 3
            </p>
          </div>
        </div>

        {/* View Mode & Code Explorer Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsApkModalOpen(true)}
            className="px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm shadow-emerald-500/20 active:scale-95 transition-all"
            title="تصدير وتثبيت تطبيق أندرويد APK"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="font-extrabold">حزمة APK</span>
          </button>

          <button
            onClick={() => setShowCodeExplorer(!showCodeExplorer)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              showCodeExplorer
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
                : isDark
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {showCodeExplorer ? 'العودة للتطبيق' : 'مشروع أندرويد (Kotlin)'}
            </span>
          </button>

          {!showCodeExplorer && (
            <button
              onClick={() => setViewMode(viewMode === 'DEVICE' ? 'EXPANDED' : 'DEVICE')}
              className={`p-2 rounded-2xl text-xs font-bold border transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
              title={viewMode === 'DEVICE' ? 'عرض ملء الشاشة' : 'عرض محاكي الهاتف'}
            >
              {viewMode === 'DEVICE' ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Smartphone className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-2 sm:p-4">
        {showCodeExplorer ? (
          <ProjectExplorer strings={strings} isDark={isDark} />
        ) : viewMode === 'DEVICE' ? (
          /* Android Phone Shell */
          <div className="flex justify-center items-center py-2">
            <div
              className={`w-full max-w-[430px] rounded-[48px] p-3 shadow-2xl border-4 transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-800 ring-1 ring-slate-700/50'
                  : 'bg-slate-800 border-slate-700 ring-1 ring-slate-900/10'
              }`}
            >
              {/* Screen Container with rounded corners */}
              <div
                className={`relative rounded-[38px] overflow-hidden min-h-[720px] max-h-[820px] flex flex-col shadow-inner transition-colors ${
                  isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
                }`}
              >
                {/* Android Status Bar */}
                <div
                  className={`h-8 px-6 flex items-center justify-between text-[11px] font-bold select-none ${
                    isDark ? 'text-slate-400 bg-slate-950' : 'text-slate-600 bg-slate-50'
                  }`}
                >
                  <span>9:41</span>
                  {/* Camera Punch Hole */}
                  <div className="w-4 h-4 rounded-full bg-black mx-auto ring-1 ring-white/10" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">5G</span>
                    <div className="w-5 h-2.5 rounded-sm border border-current p-0.5 flex items-center">
                      <div className="h-full w-3.5 bg-current rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Inner Screen Scroll View */}
                <div className="flex-1 overflow-y-auto">
                  {currentTab === 'HOME' && (
                    <HomeScreen
                      tasks={tasks}
                      categories={categories}
                      strings={strings}
                      isDark={isDark}
                      onToggleComplete={handleToggleComplete}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onRescheduleTask={handleReschedule}
                      onSnoozeTask={handleSnooze}
                      onOpenCreateTask={handleOpenCreateTask}
                      onNavigateToTasks={() => setCurrentTab('TASKS')}
                    />
                  )}
                  {currentTab === 'TASKS' && (
                    <TasksScreen
                      tasks={tasks}
                      categories={categories}
                      strings={strings}
                      isDark={isDark}
                      onToggleComplete={handleToggleComplete}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onRescheduleTask={handleReschedule}
                      onSnoozeTask={handleSnooze}
                      onOpenCreateTask={handleOpenCreateTask}
                    />
                  )}
                  {currentTab === 'CALENDAR' && (
                    <CalendarScreen
                      tasks={tasks}
                      categories={categories}
                      strings={strings}
                      isDark={isDark}
                      onToggleComplete={handleToggleComplete}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onRescheduleTask={handleReschedule}
                      onSnoozeTask={handleSnooze}
                      onOpenCreateTaskForDate={handleOpenCreateForDate}
                    />
                  )}
                  {currentTab === 'STATISTICS' && (
                    <StatisticsScreen
                      tasks={tasks}
                      categories={categories}
                      strings={strings}
                      isDark={isDark}
                    />
                  )}
                  {currentTab === 'SETTINGS' && (
                    <SettingsScreen
                      settings={settings}
                      categories={categories}
                      strings={strings}
                      isDark={isDark}
                      onUpdateSettings={s => StorageService.updateSettings(s)}
                      onAddCategory={c => StorageService.addCategory(c)}
                      onDeleteCategory={id => StorageService.deleteCategory(id)}
                      onLoadSampleData={() => {
                        StorageService.loadSampleData();
                        showToast('تم تحميل البيانات التجريبية');
                      }}
                      onClearData={() => {
                        StorageService.clearSampleData();
                        showToast('تم مسح جميع المهام');
                      }}
                      onExportBackup={handleExportBackup}
                      onImportBackup={handleImportBackup}
                      onOpenApkModal={() => setIsApkModalOpen(true)}
                    />
                  )}
                </div>

                {/* Bottom Navigation */}
                <BottomNavigation
                  currentTab={currentTab}
                  onSelectTab={setCurrentTab}
                  strings={strings}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Expanded Screen Layout */
          <div className="max-w-2xl mx-auto min-h-[720px] pb-24">
            {currentTab === 'HOME' && (
              <HomeScreen
                tasks={tasks}
                categories={categories}
                strings={strings}
                isDark={isDark}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onRescheduleTask={handleReschedule}
                onSnoozeTask={handleSnooze}
                onOpenCreateTask={handleOpenCreateTask}
                onNavigateToTasks={() => setCurrentTab('TASKS')}
              />
            )}
            {currentTab === 'TASKS' && (
              <TasksScreen
                tasks={tasks}
                categories={categories}
                strings={strings}
                isDark={isDark}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onRescheduleTask={handleReschedule}
                onSnoozeTask={handleSnooze}
                onOpenCreateTask={handleOpenCreateTask}
              />
            )}
            {currentTab === 'CALENDAR' && (
              <CalendarScreen
                tasks={tasks}
                categories={categories}
                strings={strings}
                isDark={isDark}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onRescheduleTask={handleReschedule}
                onSnoozeTask={handleSnooze}
                onOpenCreateTaskForDate={handleOpenCreateForDate}
              />
            )}
            {currentTab === 'STATISTICS' && (
              <StatisticsScreen
                tasks={tasks}
                categories={categories}
                strings={strings}
                isDark={isDark}
              />
            )}
            {currentTab === 'SETTINGS' && (
              <SettingsScreen
                settings={settings}
                categories={categories}
                strings={strings}
                isDark={isDark}
                onUpdateSettings={s => StorageService.updateSettings(s)}
                onAddCategory={c => StorageService.addCategory(c)}
                onDeleteCategory={id => StorageService.deleteCategory(id)}
                onLoadSampleData={() => {
                  StorageService.loadSampleData();
                  showToast('تم تحميل البيانات التجريبية');
                }}
                onClearData={() => {
                  StorageService.clearSampleData();
                  showToast('تم مسح جميع المهام');
                }}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onOpenApkModal={() => setIsApkModalOpen(true)}
              />
            )}

            <BottomNavigation
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              strings={strings}
              isDark={isDark}
            />
          </div>
        )}
      </main>

      {/* Task Create / Edit Dialog */}
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
        categories={categories}
        strings={strings}
        isDark={isDark}
        selectedDate={selectedDateForNewTask}
      />

      {/* Reschedule Modal */}
      {reschedulingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setReschedulingTask(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl space-y-4 animate-in fade-in zoom-in-95 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
              <h3 className="text-base font-extrabold">
                {strings.actionReschedule}
              </h3>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {reschedulingTask.title}
            </p>

            <div>
              <label className="block text-[11px] font-extrabold mb-1.5 text-slate-500">
                {strings.labelDate}
              </label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReschedulingTask(null)}
                className="px-4 py-2 text-xs font-bold rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {strings.actionCancel}
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-5 py-2 text-xs font-extrabold rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                {strings.actionSave}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Alarm Banner / Popup */}
      {activeAlarm && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 text-white shadow-2xl flex items-center justify-between gap-3 border border-indigo-400/30 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 block">
                  تنبيه موعد مهمة
                </span>
                <span className="text-xs font-black truncate block">
                  {activeAlarm.taskTitle}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => {
                  handleToggleComplete(activeAlarm.taskId, true);
                  setActiveAlarm(null);
                }}
                className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm active:scale-95 transition-all"
              >
                إكمال
              </button>
              <button
                onClick={() => setActiveAlarm(null)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-2 border border-white/10 dark:border-slate-200 transition-all animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* APK Export & Build Modal */}
      <ApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
