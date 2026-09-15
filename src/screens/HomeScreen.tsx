import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  ArrowRight,
  ArrowLeft,
  Flame,
  Check,
  TrendingUp
} from 'lucide-react';
import { Category, Task } from '../types';
import { LocaleStrings } from '../locales/strings';
import { TaskCard } from '../components/TaskCard';

interface HomeScreenProps {
  tasks: Task[];
  categories: Category[];
  strings: LocaleStrings;
  isDark: boolean;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onRescheduleTask: (task: Task) => void;
  onSnoozeTask: (task: Task) => void;
  onOpenCreateTask: () => void;
  onNavigateToTasks: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  tasks,
  categories,
  strings,
  isDark,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onRescheduleTask,
  onSnoozeTask,
  onOpenCreateTask,
  onNavigateToTasks
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentTimeStr = new Date().toTimeString().slice(0, 5);

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  // Today's tasks
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const completedToday = todayTasks.filter(t => t.status === 'COMPLETED').length;
  const remainingToday = todayTasks.length - completedToday;
  const completionPercent = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;

  // Overdue tasks
  const overdueTasks = tasks.filter(
    t =>
      t.status !== 'COMPLETED' &&
      (t.date < todayStr || (t.date === todayStr && t.endTime < currentTimeStr))
  );

  // Upcoming tasks
  const upcomingTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.date > todayStr);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return strings.greetingMorning;
    if (hour >= 12 && hour < 17) return strings.greetingAfternoon;
    return strings.greetingEvening;
  };

  // Arabic formatted date
  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  return (
    <div className="pb-24 pt-3 px-3.5 sm:px-4 max-w-lg mx-auto space-y-4 sm:space-y-5">
      {/* Top Bar Greeting */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{getGreeting()}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5 text-slate-900 dark:text-white">
            {formattedDate}
          </h1>
        </div>

        <button
          onClick={onOpenCreateTask}
          className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
          aria-label={strings.actionCreateTask}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{strings.actionCreateTask}</span>
        </button>
      </div>

      {/* Modern High-Impact Progress Hero Card */}
      <div className="relative rounded-3xl p-5 overflow-hidden shadow-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white">
        {/* Background decorative circles */}
        <div className="absolute -top-12 -end-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -start-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                {strings.todayProgress}
              </span>
              <h2 className="text-2xl font-black mt-0.5">
                {completionPercent}%
              </h2>
              <p className="text-xs text-indigo-100/90 mt-1 font-medium">
                {completedToday} {strings.completedTasks} • {remainingToday} {strings.remainingTasks}
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-inner">
              <TrendingUp className="w-6 h-6 text-white" />
              <span className="text-[10px] font-extrabold mt-0.5">{todayTasks.length} مهام</span>
            </div>
          </div>

          {/* Sleek Progress Bar */}
          <div className="mt-4 w-full h-2.5 bg-black/20 rounded-full p-0.5 overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Quick motivational footer */}
          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-indigo-100">
            <span>{strings.productivitySummary}:</span>
            <span className="text-teal-200">
              {completedToday >= 3 ? strings.outstanding : strings.keepGoing}
            </span>
          </div>
        </div>
      </div>

      {/* Overdue Alert Banner (if any) */}
      {overdueTasks.length > 0 && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-sm transition-all ${
            isDark
              ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold">
              <span className="font-extrabold">{overdueTasks.length}</span> {strings.sectionOverdue}
            </div>
          </div>
          <button
            onClick={onNavigateToTasks}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 transition-colors"
          >
            {strings.review}
          </button>
        </div>
      )}

      {/* Today's Tasks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold tracking-tight">
              {strings.sectionToday}
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {todayTasks.length}
            </span>
          </div>

          <button
            onClick={onNavigateToTasks}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            <span>{strings.tabAll}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div
            className={`p-8 rounded-3xl border text-center transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-white border-slate-200/80 text-slate-500 shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {strings.emptyToday}
            </p>
            <p className="text-[11px] text-slate-400">
              اضغط على زر مهمة جديدة بالأعلى لبدء يومك بنشاط
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                category={task.categoryId ? categoryMap.get(task.categoryId) : undefined}
                strings={strings}
                isDark={isDark}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onReschedule={onRescheduleTask}
                onSnooze={onSnoozeTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Tasks Section Preview */}
      {upcomingTasks.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight">
                {strings.sectionUpcoming}
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {upcomingTasks.length}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {upcomingTasks.slice(0, 3).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                category={task.categoryId ? categoryMap.get(task.categoryId) : undefined}
                strings={strings}
                isDark={isDark}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onReschedule={onRescheduleTask}
                onSnooze={onSnoozeTask}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
