import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Bell,
  Repeat,
  MoreVertical,
  Check,
  Calendar as CalendarIcon,
  Trash2,
  Edit3,
  ListTodo
} from 'lucide-react';
import { Category, Priority, Task } from '../types';
import { LocaleStrings } from '../locales/strings';

interface TaskCardProps {
  task: Task;
  category?: Category;
  strings: LocaleStrings;
  isDark: boolean;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onReschedule: (task: Task) => void;
  onSnooze: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  category,
  strings,
  isDark,
  onToggleComplete,
  onEdit,
  onDelete,
  onReschedule,
  onSnooze
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isCompleted = task.status === 'COMPLETED';

  // Subtasks progress calculation
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {strings.priorityHigh}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {strings.priorityMedium}
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {strings.priorityLow}
          </span>
        );
    }
  };

  const getRecurrenceLabel = () => {
    switch (task.recurrence.type) {
      case 'DAILY': return strings.recurrenceDaily;
      case 'WEEKLY': return strings.recurrenceWeekly;
      case 'WEEKDAY_MASK': return strings.recurrenceWeekday;
      case 'MONTHLY': return strings.recurrenceMonthly;
      case 'YEARLY': return strings.recurrenceYearly;
      default: return null;
    }
  };

  const recurrenceLabel = getRecurrenceLabel();

  return (
    <div
      id={`task-card-${task.id}`}
      className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
        isCompleted
          ? isDark
            ? 'bg-slate-900/40 border-slate-800/80 text-slate-500'
            : 'bg-slate-50/80 border-slate-200/60 text-slate-400'
          : isDark
          ? 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-indigo-500/40 text-slate-100 shadow-md shadow-black/20 hover:shadow-indigo-500/5'
          : 'bg-white hover:bg-white border-slate-200/90 hover:border-indigo-200 text-slate-900 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Active priority accent indicator */}
      {!isCompleted && task.priority === 'HIGH' && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500" />
      )}

      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Modern Animated Checkbox */}
        <button
          id={`task-checkbox-${task.id}`}
          onClick={() => onToggleComplete(task.id, !isCompleted)}
          aria-label={isCompleted ? strings.actionComplete : 'Mark complete'}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20 scale-100'
              : isDark
              ? 'border-slate-600 hover:border-indigo-400 bg-slate-800/80 hover:bg-indigo-500/10'
              : 'border-slate-300 hover:border-indigo-600 bg-slate-50 hover:bg-indigo-50'
          }`}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3] animate-in zoom-in-50 duration-150" />}
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(task)}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className={`text-sm sm:text-base font-bold tracking-tight transition-all duration-200 ${
                isCompleted
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : isDark
                  ? 'text-slate-100 group-hover:text-indigo-300'
                  : 'text-slate-900 group-hover:text-indigo-600'
              }`}
            >
              {task.title}
            </h3>
          </div>

          {task.description && (
            <p
              className={`text-xs mb-2.5 line-clamp-2 leading-relaxed ${
                isCompleted
                  ? 'text-slate-400 dark:text-slate-600'
                  : isDark
                  ? 'text-slate-300'
                  : 'text-slate-600'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Time & Badges Row */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
            {/* Time Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${
                isDark
                  ? 'bg-slate-800 text-slate-300 border border-slate-700/60'
                  : 'bg-slate-100 text-slate-700 border border-slate-200/60'
              }`}
            >
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>{task.startTime} - {task.endTime}</span>
            </span>

            {/* Category Pill */}
            {category && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-lg border"
                style={{
                  backgroundColor: `${category.colorHex}15`,
                  color: category.colorHex,
                  borderColor: `${category.colorHex}30`
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: category.colorHex }}
                />
                {category.name}
              </span>
            )}

            {/* Priority Badge */}
            {getPriorityBadge(task.priority)}

            {/* Recurrence Pill */}
            {recurrenceLabel && (
              <span
                title={strings.labelRecurrence}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20"
              >
                <Repeat className="w-2.5 h-2.5" />
                <span>{recurrenceLabel}</span>
              </span>
            )}

            {/* Reminder Icon */}
            {task.reminder !== 'NONE' && (
              <span
                title={strings.labelReminder}
                className="inline-flex items-center p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400"
              >
                <Bell className="w-3 h-3" />
              </span>
            )}

            {/* Location Pill */}
            {task.location && (
              <span
                title={task.location}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]"
              >
                <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                <span className="truncate">{task.location}</span>
              </span>
            )}
          </div>

          {/* Subtasks Progress */}
          {totalSubtasks > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                  <ListTodo className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    {completedSubtasks} / {totalSubtasks} {strings.labelSubtasks}
                  </span>
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  %{Math.round(subtaskProgress)}
                </span>
              </div>
              <div className="w-full bg-slate-200/60 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Menu Button */}
        <div className="relative">
          <button
            id={`task-menu-btn-${task.id}`}
            onClick={e => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={e => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div
                className={`absolute end-0 top-8 z-40 w-44 rounded-2xl shadow-xl border p-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
                  isDark
                    ? 'bg-slate-900/95 border-slate-800 text-slate-200'
                    : 'bg-white/95 border-slate-200 text-slate-800'
                }`}
              >
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full px-3 py-2 text-start text-xs font-semibold rounded-xl flex items-center gap-2 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{strings.actionEditTask}</span>
                </button>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onReschedule(task);
                  }}
                  className="w-full px-3 py-2 text-start text-xs font-semibold rounded-xl flex items-center gap-2 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>{strings.actionReschedule}</span>
                </button>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onSnooze(task);
                  }}
                  className="w-full px-3 py-2 text-start text-xs font-semibold rounded-xl flex items-center gap-2 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 text-purple-500" />
                  <span>{strings.actionSnooze}</span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(task.id);
                  }}
                  className="w-full px-3 py-2 text-start text-xs font-semibold rounded-xl flex items-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{strings.actionDelete}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
