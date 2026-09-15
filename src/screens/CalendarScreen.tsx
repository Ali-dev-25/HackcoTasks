import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Category, Task } from '../types';
import { LocaleStrings } from '../locales/strings';
import { TaskCard } from '../components/TaskCard';

interface CalendarScreenProps {
  tasks: Task[];
  categories: Category[];
  strings: LocaleStrings;
  isDark: boolean;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onRescheduleTask: (task: Task) => void;
  onSnoozeTask: (task: Task) => void;
  onOpenCreateTaskForDate: (dateStr: string) => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  tasks,
  categories,
  strings,
  isDark,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onRescheduleTask,
  onSnoozeTask,
  onOpenCreateTaskForDate
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState(today.toISOString().split('T')[0]);

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Weekday start offset for Saturday (6) or Sunday (0)
  // Standard Arabic calendar starts on Saturday
  // JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Offset from Saturday: (getDay() + 1) % 7
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startDayOffset = (firstDayOfMonth + 1) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Tasks mapped by date string
  const tasksByDate = new Map<string, Task[]>();
  tasks.forEach(t => {
    const list = tasksByDate.get(t.date) || [];
    list.push(t);
    tasksByDate.set(t.date, list);
  });

  const monthName = new Intl.DateTimeFormat('ar-EG', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(currentYear, currentMonth, 1));

  const selectedTasks = tasksByDate.get(selectedDateStr) || [];
  selectedTasks.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Arabic Day abbreviations starting Saturday
  const dayHeaders = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];

  const selectedDateFormatted = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date(selectedDateStr + 'T00:00:00'));

  return (
    <div className="pb-24 pt-3 px-3.5 sm:px-4 max-w-lg mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {strings.navCalendar}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            جدول ومواعيد المهام اليومية والشهرية
          </p>
        </div>

        <button
          onClick={() => onOpenCreateTaskForDate(selectedDateStr)}
          className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
          aria-label={strings.actionCreateTask}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{strings.actionCreateTask}</span>
        </button>
      </div>

      {/* Calendar Card */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-xl shadow-black/20'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold capitalize text-slate-900 dark:text-white">
            {monthName}
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="الشهر السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setCurrentYear(now.getFullYear());
                setCurrentMonth(now.getMonth());
                setSelectedDateStr(now.toISOString().split('T')[0]);
              }}
              className="px-2.5 py-1 text-xs font-bold rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
            >
              {strings.today}
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="الشهر القادم"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayHeaders.map((dh, i) => (
            <span
              key={i}
              className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 py-1"
            >
              {dh}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDateStr;
            const isCurrentToday = dateStr === today.toISOString().split('T')[0];
            const dayTasks = tasksByDate.get(dateStr) || [];
            const hasTasks = dayTasks.length > 0;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-11 rounded-2xl flex flex-col items-center justify-center relative transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold shadow-md shadow-indigo-500/30 scale-105 z-10'
                    : isCurrentToday
                    ? isDark
                      ? 'border border-indigo-500 text-indigo-400 font-bold bg-indigo-500/10'
                      : 'border border-indigo-600 text-indigo-600 font-bold bg-indigo-50'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs">{dayNum}</span>

                {/* Dot Indicators for tasks */}
                {hasTasks && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {dayTasks.slice(0, 3).map((t, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-white'
                            : t.priority === 'HIGH'
                            ? 'bg-rose-500'
                            : t.priority === 'MEDIUM'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {selectedDateFormatted}
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {selectedTasks.length}
            </span>
          </div>

          <button
            onClick={() => onOpenCreateTaskForDate(selectedDateStr)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{strings.addTaskForDate}</span>
          </button>
        </div>

        {selectedTasks.length === 0 ? (
          <div
            className={`p-8 rounded-3xl border text-center transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-white border-slate-200/80 text-slate-500 shadow-sm'
            }`}
          >
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400/80" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {strings.noTasksScheduled}
            </p>
            <button
              onClick={() => onOpenCreateTaskForDate(selectedDateStr)}
              className="mt-2.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
            >
              + {strings.addTaskForDate}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedTasks.map(task => (
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
    </div>
  );
};
