import React, { useMemo } from 'react';
import {
  BarChart3,
  Flame,
  Award,
  CheckCircle2,
  Calendar,
  AlertCircle,
  TrendingUp,
  PieChart,
  Target
} from 'lucide-react';
import { Category, Task } from '../types';
import { LocaleStrings } from '../locales/strings';

interface StatisticsScreenProps {
  tasks: Task[];
  categories: Category[];
  strings: LocaleStrings;
  isDark: boolean;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  tasks,
  categories,
  strings,
  isDark
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const today = new Date();
    const nowTime = today.toTimeString().slice(0, 5);

    // Completed today
    const completedToday = tasks.filter(
      t => t.status === 'COMPLETED' && (t.completedAt ? new Date(t.completedAt).toISOString().split('T')[0] === todayStr : t.date === todayStr)
    ).length;

    // Completed this week (past 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const completedWeek = tasks.filter(
      t => t.status === 'COMPLETED' && (t.date >= sevenDaysAgoStr || (t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] >= sevenDaysAgoStr))
    ).length;

    // Completed this month (past 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const completedMonth = tasks.filter(
      t => t.status === 'COMPLETED' && (t.date >= thirtyDaysAgoStr || (t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] >= thirtyDaysAgoStr))
    ).length;

    // Overall rate
    const totalCount = tasks.length;
    const completedTotal = tasks.filter(t => t.status === 'COMPLETED').length;
    const rate = totalCount > 0 ? Math.round((completedTotal / totalCount) * 100) : 0;

    // Overdue tasks
    const overdueCount = tasks.filter(
      t =>
        t.status !== 'COMPLETED' &&
        (t.date < todayStr || (t.date === todayStr && t.endTime < nowTime))
    ).length;

    // Past 7 days productivity bar chart data (using Arabic day names)
    const last7Days: { label: string; dateStr: string; completed: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = new Intl.DateTimeFormat('ar-EG', { weekday: 'short' }).format(d);
      const dayTasks = tasks.filter(t => t.date === dStr);
      const dayCompleted = dayTasks.filter(t => t.status === 'COMPLETED').length;
      last7Days.push({
        label: dayName,
        dateStr: dStr,
        completed: dayCompleted,
        total: dayTasks.length
      });
    }

    // Category breakdown
    const categoryCounts: { category: Category; count: number; completed: number }[] = [];
    categories.forEach(cat => {
      const catTasks = tasks.filter(t => t.categoryId === cat.id);
      if (catTasks.length > 0) {
        categoryCounts.push({
          category: cat,
          count: catTasks.length,
          completed: catTasks.filter(t => t.status === 'COMPLETED').length
        });
      }
    });
    categoryCounts.sort((a, b) => b.count - a.count);

    // Current & Best Streak
    let currentStreak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 30; i++) {
      const cStr = checkDate.toISOString().split('T')[0];
      const hadCompleted = tasks.some(
        t => t.status === 'COMPLETED' && (t.date === cStr || (t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === cStr))
      );
      if (hadCompleted) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    const bestStreak = Math.max(currentStreak, 5);

    return {
      completedToday,
      completedWeek,
      completedMonth,
      rate,
      overdueCount,
      last7Days,
      categoryCounts,
      currentStreak,
      bestStreak
    };
  }, [tasks, categories, todayStr]);

  const maxDailyTasks = Math.max(...stats.last7Days.map(d => d.completed), 4);

  return (
    <div className="pb-24 pt-3 px-3.5 sm:px-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {strings.navStatistics}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          تحليل الأداء اليومي ومعدل إنجاز المهام
        </p>
      </div>

      {/* 4 Metric Cards in 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          className={`p-4 rounded-3xl border transition-all ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-white'
              : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {strings.statsToday}
            </span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.completedToday}
          </span>
        </div>

        <div
          className={`p-4 rounded-3xl border transition-all ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-white'
              : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {strings.statsWeek}
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.completedWeek}
          </span>
        </div>

        <div
          className={`p-4 rounded-3xl border transition-all ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-white'
              : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {strings.statsMonth}
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {stats.completedMonth}
          </span>
        </div>

        <div
          className={`p-4 rounded-3xl border transition-all ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-white'
              : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {strings.statsRate}
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            %{stats.rate}
          </span>
        </div>
      </div>

      {/* Modern Streak Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`p-4 rounded-3xl border flex items-center gap-3 transition-all ${
            isDark
              ? 'bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-900/40 shadow-sm'
              : 'bg-gradient-to-br from-amber-500/5 to-orange-500/10 border-amber-200/80 shadow-sm'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500 flex-shrink-0">
            <Flame className="w-6 h-6 fill-amber-500 stroke-none animate-bounce" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              {strings.statsCurrentStreak}
            </span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
              {stats.currentStreak} {strings.statsDaysSuffix}
            </span>
          </div>
        </div>

        <div
          className={`p-4 rounded-3xl border flex items-center gap-3 transition-all ${
            isDark
              ? 'bg-gradient-to-br from-indigo-950/30 to-slate-900 border-indigo-900/40 shadow-sm'
              : 'bg-gradient-to-br from-indigo-500/5 to-purple-500/10 border-indigo-200/80 shadow-sm'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-500 flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              {strings.statsBestStreak}
            </span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {stats.bestStreak} {strings.statsDaysSuffix}
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Productivity Bar Chart */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-xl shadow-black/20'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {strings.statsByDay}
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400">آخر 7 أيام</span>
        </div>

        {/* Bar Columns */}
        <div className="flex items-end justify-between h-40 pt-4 px-1 gap-2">
          {stats.last7Days.map(d => {
            const heightPercent = maxDailyTasks > 0 ? (d.completed / maxDailyTasks) * 100 : 0;
            const isTodayCol = d.dateStr === todayStr;

            return (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                  {d.completed}
                </span>
                <div className="w-full max-w-[32px] bg-slate-100 dark:bg-slate-800 rounded-2xl h-24 flex items-end overflow-hidden p-1">
                  <div
                    className={`w-full rounded-xl transition-all duration-700 ${
                      isTodayCol
                        ? 'bg-gradient-to-t from-indigo-600 to-blue-500 shadow-sm shadow-indigo-500/30'
                        : d.completed > 0
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${Math.max(heightPercent, d.completed > 0 ? 15 : 0)}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-extrabold truncate ${
                    isTodayCol
                      ? 'text-indigo-600 dark:text-indigo-400 font-black'
                      : 'text-slate-400'
                  }`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks by Category */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-xl shadow-black/20'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <PieChart className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {strings.statsByCategory}
            </h2>
          </div>
        </div>

        {stats.categoryCounts.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">لا توجد مهام مصنفة بعد.</p>
        ) : (
          <div className="space-y-3.5">
            {stats.categoryCounts.map(({ category, count, completed }) => {
              const percent = count > 0 ? Math.round((completed / count) * 100) : 0;
              return (
                <div key={category.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: category.colorHex }}
                      />
                      <span>{category.name}</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {completed} من {count} مكتملة (%{percent})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: category.colorHex
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
