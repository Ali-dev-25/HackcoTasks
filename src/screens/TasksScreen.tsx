import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Plus, X, Tag, Flag, CheckCircle2 } from 'lucide-react';
import { Category, Priority, SortOrder, Task, TaskFilterTab } from '../types';
import { LocaleStrings } from '../locales/strings';
import { TaskCard } from '../components/TaskCard';

interface TasksScreenProps {
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
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  categories,
  strings,
  isDark,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onRescheduleTask,
  onSnoozeTask,
  onOpenCreateTask
}) => {
  const [activeTab, setActiveTab] = useState<TaskFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DATE_TIME');
  const [showFilters, setShowFilters] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentTimeStr = new Date().toTimeString().slice(0, 5);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Tab filter
        if (activeTab === 'TODAY' && task.date !== todayStr) return false;
        if (activeTab === 'UPCOMING' && !(task.date > todayStr && task.status !== 'COMPLETED')) return false;
        if (
          activeTab === 'OVERDUE' &&
          !(
            task.status !== 'COMPLETED' &&
            (task.date < todayStr || (task.date === todayStr && task.endTime < currentTimeStr))
          )
        ) {
          return false;
        }
        if (activeTab === 'COMPLETED' && task.status !== 'COMPLETED') return false;

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const catName = task.categoryId ? categoryMap.get(task.categoryId)?.name.toLowerCase() || '' : '';
          const titleMatch = task.title.toLowerCase().includes(q);
          const descMatch = (task.description || '').toLowerCase().includes(q);
          const notesMatch = (task.notes || '').toLowerCase().includes(q);
          const locMatch = (task.location || '').toLowerCase().includes(q);
          const catMatch = catName.includes(q);
          if (!titleMatch && !descMatch && !notesMatch && !catMatch && !locMatch) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'ALL' && task.categoryId !== selectedCategory) {
          return false;
        }

        // Priority filter
        if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'DATE_TIME') {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        } else if (sortOrder === 'PRIORITY') {
          const pOrder: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return pOrder[b.priority] - pOrder[a.priority];
        } else {
          return a.title.localeCompare(b.title);
        }
      });
  }, [
    tasks,
    activeTab,
    searchQuery,
    selectedCategory,
    selectedPriority,
    sortOrder,
    todayStr,
    currentTimeStr,
    categoryMap
  ]);

  const tabs: { id: TaskFilterTab; label: string; count: number }[] = [
    { id: 'ALL', label: strings.tabAll, count: tasks.length },
    { id: 'TODAY', label: strings.tabToday, count: tasks.filter(t => t.date === todayStr).length },
    { id: 'UPCOMING', label: strings.tabUpcoming, count: tasks.filter(t => t.date > todayStr && t.status !== 'COMPLETED').length },
    {
      id: 'OVERDUE',
      label: strings.tabOverdue,
      count: tasks.filter(
        t =>
          t.status !== 'COMPLETED' &&
          (t.date < todayStr || (t.date === todayStr && t.endTime < currentTimeStr))
      ).length
    },
    { id: 'COMPLETED', label: strings.tabCompleted, count: tasks.filter(t => t.status === 'COMPLETED').length }
  ];

  return (
    <div className="pb-24 pt-3 px-3.5 sm:px-4 max-w-lg mx-auto space-y-4">
      {/* Title & Modern Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {strings.navTasks}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'مهمة متاحة' : 'مهام متاحة'}
          </p>
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

      {/* Modern Search & Filter Controls */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`flex-1 flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
                : 'bg-white border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-sm'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={strings.filterSearchHint}
              className="w-full text-xs bg-transparent focus:outline-none placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center ${
              showFilters || selectedCategory !== 'ALL' || selectedPriority !== 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
            aria-label="Filter Options"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div
            className={`p-4 rounded-3xl border space-y-3.5 animate-in fade-in zoom-in-95 duration-150 ${
              isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
            }`}
          >
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  {strings.labelCategory}
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="ALL">{strings.filterAllCategories}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  {strings.labelPriority}
                </label>
                <select
                  value={selectedPriority}
                  onChange={e => setSelectedPriority(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="ALL">{strings.filterAllPriorities}</option>
                  <option value="HIGH">{strings.priorityHigh}</option>
                  <option value="MEDIUM">{strings.priorityMedium}</option>
                  <option value="LOW">{strings.priorityLow}</option>
                </select>
              </div>
            </div>

            {/* Sort Order */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold">
                {strings.sortBy}:
              </span>
              <div className="flex gap-1.5">
                {(
                  [
                    { id: 'DATE_TIME', label: strings.sortDate },
                    { id: 'PRIORITY', label: strings.sortPriority },
                    { id: 'TITLE', label: strings.sortTitle }
                  ] as { id: SortOrder; label: string }[]
                ).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSortOrder(s.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      sortOrder === s.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20'
                  : isDark
                  ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : isDark
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div
            className={`p-10 rounded-3xl border text-center transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-white border-slate-200/80 text-slate-500 shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {strings.emptyTasks}
            </p>
            <p className="text-[11px] text-slate-400">
              جرب تغيير خيارات البحث أو التصفية لعرض المهام
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
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
          ))
        )}
      </div>
    </div>
  );
};
