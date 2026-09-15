import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  Flag,
  Tag,
  Bell,
  Repeat,
  MapPin,
  FileText,
  ListTodo,
  Check
} from 'lucide-react';
import { Category, Priority, RecurrenceRule, RecurrenceType, ReminderOption, SubTask, Task } from '../types';
import { LocaleStrings } from '../locales/strings';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  initialTask?: Task | null;
  categories: Category[];
  strings: LocaleStrings;
  isDark: boolean;
  selectedDate?: string;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  categories,
  strings,
  isDark,
  selectedDate
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [categoryId, setCategoryId] = useState<string>('');
  const [reminder, setReminder] = useState<ReminderOption>('NONE');
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({
    type: 'NONE',
    interval: 1,
    daysOfWeek: []
  });
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || '');
        setDate(initialTask.date);
        setStartTime(initialTask.startTime);
        setEndTime(initialTask.endTime);
        setPriority(initialTask.priority);
        setCategoryId(initialTask.categoryId || (categories[0]?.id || ''));
        setReminder(initialTask.reminder || 'NONE');
        setRecurrence(initialTask.recurrence || { type: 'NONE', interval: 1, daysOfWeek: [] });
        setLocation(initialTask.location || '');
        setNotes(initialTask.notes || '');
        setSubtasks(initialTask.subtasks ? [...initialTask.subtasks] : []);
      } else {
        const todayStr = selectedDate || new Date().toISOString().split('T')[0];
        setTitle('');
        setDescription('');
        setDate(todayStr);
        setStartTime('09:00');
        setEndTime('10:00');
        setPriority('MEDIUM');
        setCategoryId(categories[0]?.id || '');
        setReminder('MIN_15');
        setRecurrence({ type: 'NONE', interval: 1, daysOfWeek: [] });
        setLocation('');
        setNotes('');
        setSubtasks([]);
      }
    }
  }, [isOpen, initialTask, selectedDate, categories]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: 'sub-' + Date.now(),
      taskId: initialTask?.id || 'temp',
      title: newSubtaskTitle.trim(),
      isCompleted: false,
      orderIndex: subtasks.length
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map(s => (s.id === id ? { ...s, isCompleted: !s.isCompleted } : s))
    );
  };

  const toggleWeekday = (dayNumber: number) => {
    const currentDays = recurrence.daysOfWeek || [];
    const updated = currentDays.includes(dayNumber)
      ? currentDays.filter(d => d !== dayNumber)
      : [...currentDays, dayNumber].sort();
    setRecurrence({ ...recurrence, daysOfWeek: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage(strings.errEmptyTitle);
      return;
    }

    if (endTime <= startTime) {
      setErrorMessage(strings.errInvalidTime);
      return;
    }

    const taskToSave: Task = {
      id: initialTask ? initialTask.id : 'task-' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      priority,
      status: initialTask ? initialTask.status : 'PENDING',
      categoryId: categoryId || undefined,
      location: location.trim(),
      notes: notes.trim(),
      recurrence,
      reminder,
      createdAt: initialTask ? initialTask.createdAt : Date.now(),
      updatedAt: Date.now(),
      completedAt: initialTask ? initialTask.completedAt : undefined,
      subtasks
    };

    onSave(taskToSave);
    onClose();
  };

  const weekdayNames = [
    { num: 6, label: 'السبت' },
    { num: 7, label: 'الأحد' },
    { num: 1, label: 'الإثنين' },
    { num: 2, label: 'الثلاثاء' },
    { num: 3, label: 'الأربعاء' },
    { num: 4, label: 'الخميس' },
    { num: 5, label: 'الجمعة' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="task-dialog"
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-lg my-6 rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] transition-all animate-in fade-in zoom-in-95 ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <h2 className="text-base sm:text-lg font-black tracking-tight">
            {initialTask ? strings.actionEditTask : strings.actionCreateTask}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 text-xs font-bold flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] font-extrabold mb-1 uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {strings.labelTitle} *
            </label>
            <input
              id="input-task-title"
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: مراجعة خطة العمل الأسبوعية..."
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDark
                  ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-extrabold mb-1 uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {strings.labelDescription}
            </label>
            <textarea
              id="input-task-desc"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="أضف تفاصيل أو أهداف فرعية رئيسية..."
              className={`w-full px-3.5 py-2 rounded-2xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDark
                  ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Date, Start Time & End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-extrabold mb-1 text-slate-500 dark:text-slate-400">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>{strings.labelDate}</span>
              </label>
              <input
                id="input-task-date"
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-extrabold mb-1 text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{strings.labelStartTime}</span>
              </label>
              <input
                id="input-task-start-time"
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-extrabold mb-1 text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{strings.labelEndTime}</span>
              </label>
              <input
                id="input-task-end-time"
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-extrabold mb-1 text-slate-500 dark:text-slate-400">
                <Flag className="w-3.5 h-3.5 text-indigo-500" />
                <span>{strings.labelPriority}</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                {(['LOW', 'MEDIUM', 'HIGH'] as Priority[]).map(p => {
                  const isSel = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 text-xs font-extrabold rounded-xl transition-all ${
                        isSel
                          ? p === 'HIGH'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : p === 'MEDIUM'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {p === 'HIGH'
                        ? strings.priorityHigh
                        : p === 'MEDIUM'
                        ? strings.priorityMedium
                        : strings.priorityLow}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-extrabold mb-1 text-slate-500 dark:text-slate-400">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>{strings.labelCategory}</span>
              </label>
              <select
                id="select-task-category"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className={`w-full px-3 py-2 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reminder & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-extrabold mb-1 text-slate-500 dark:text-slate-400">
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                <span>{strings.labelReminder}</span>
              </label>
              <select
                value={reminder}
                onChange={e => setReminder(e.target.value as ReminderOption)}
                className={`w-full px-3 py-2 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="NONE">{strings.reminderNone}</option>
                <option value="AT_TIME">{strings.reminderAtTime}</option>
                <option value="MIN_5">{strings.reminder5min}</option>
                <option value="MIN_10">{strings.reminder10min}</option>
                <option value="MIN_15">{strings.reminder15min}</option>
                <option value="MIN_30">{strings.reminder30min}</option>
                <option value="HOUR_1">{strings.reminder1hour}</option>
                <option value="DAY_1">{strings.reminder1day}</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-extrabold mb-1 text-slate-500 dark:text-slate-400">
                <Repeat className="w-3.5 h-3.5 text-indigo-500" />
                <span>{strings.labelRecurrence}</span>
              </label>
              <select
                value={recurrence.type}
                onChange={e =>
                  setRecurrence({ ...recurrence, type: e.target.value as RecurrenceType })
                }
                className={`w-full px-3 py-2 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="NONE">{strings.recurrenceNone}</option>
                <option value="DAILY">{strings.recurrenceDaily}</option>
                <option value="WEEKLY">{strings.recurrenceWeekly}</option>
                <option value="WEEKDAY_MASK">{strings.recurrenceWeekday}</option>
                <option value="EVERY_N_DAYS">{strings.recurrenceEveryNDays}</option>
                <option value="EVERY_N_WEEKS">{strings.recurrenceEveryNWeeks}</option>
                <option value="MONTHLY">{strings.recurrenceMonthly}</option>
                <option value="YEARLY">{strings.recurrenceYearly}</option>
              </select>
            </div>
          </div>

          {/* Weekly recurrence: Days of week selector */}
          {recurrence.type === 'WEEKLY' && (
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
              <span className="block text-xs font-bold mb-2 text-slate-700 dark:text-slate-300">
                أيام التكرار الأسبوعية:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {weekdayNames.map(day => {
                  const isSelected = recurrence.daysOfWeek?.includes(day.num);
                  return (
                    <button
                      key={day.num}
                      type="button"
                      onClick={() => toggleWeekday(day.num)}
                      className={`px-3 py-1 text-xs rounded-xl font-bold transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interval for N days or N weeks */}
          {(recurrence.type === 'EVERY_N_DAYS' || recurrence.type === 'EVERY_N_WEEKS') && (
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-slate-500">التكرار كل:</span>
              <input
                type="number"
                min="1"
                max="90"
                value={recurrence.interval || 1}
                onChange={e =>
                  setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })
                }
                className={`w-20 px-2.5 py-1.5 text-xs rounded-xl border font-bold ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                }`}
              />
              <span className="text-slate-500">
                {recurrence.type === 'EVERY_N_DAYS' ? 'أيام' : 'أسابيع'}
              </span>
            </div>
          )}

          {/* Location & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-extrabold mb-1 text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>{strings.labelLocation}</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="المكتب، المنزل، عن بُعد..."
                className={`w-full px-3 py-2 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'
                }`}
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-extrabold mb-1 text-slate-500 dark:text-slate-400">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>{strings.labelNotes}</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ملاحظات وتفاصيل إضافية..."
                className={`w-full px-3 py-2 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between text-xs font-bold mb-2 text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-indigo-500" />
                <span>{strings.labelSubtasks} ({subtasks.length})</span>
              </span>
            </label>

            {/* List of current subtasks */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                {subtasks.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <label className="flex items-center gap-2 text-xs font-medium flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sub.isCompleted}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={sub.isCompleted ? 'line-through text-slate-400' : ''}>
                        {sub.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new subtask row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="أضف خطوة فرعية..."
                className={`flex-1 px-3 py-2 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 rounded-2xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{strings.actionAddSubtask}</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {strings.actionCancel}
            </button>
            <button
              id="btn-save-task"
              type="submit"
              className="px-5 py-2.5 text-xs font-extrabold rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/25 active:scale-95 transition-all"
            >
              {strings.actionSave}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
