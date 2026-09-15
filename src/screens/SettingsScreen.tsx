import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Globe,
  Bell,
  Volume2,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Plus,
  ShieldCheck,
  Check,
  AlertCircle,
  Tag,
  Smartphone
} from 'lucide-react';
import { Category, UserSettings } from '../types';
import { LocaleStrings } from '../locales/strings';
import { NotificationService } from '../services/notifications';

interface SettingsScreenProps {
  settings: UserSettings;
  categories: Category[];
  strings: LocaleStrings;
  isDark: boolean;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => { success: boolean; reason?: string };
  onLoadSampleData: () => void;
  onClearData: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonString: string) => boolean;
  onOpenApkModal?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  categories,
  strings,
  isDark,
  onUpdateSettings,
  onAddCategory,
  onDeleteCategory,
  onLoadSampleData,
  onClearData,
  onExportBackup,
  onImportBackup,
  onOpenApkModal
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#4F46E5');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [dataMessage, setDataMessage] = useState<string | null>(null);

  const colors = [
    '#4F46E5', // Indigo
    '#2563EB', // Blue
    '#059669', // Emerald
    '#D97706', // Amber
    '#E11D48', // Rose
    '#7C3AED', // Violet
    '#0891B2', // Cyan
    '#64748B'  // Slate
  ];

  const handleTestSound = () => {
    NotificationService.getInstance().playChime();
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat: Category = {
      id: 'cat-' + Date.now(),
      name: newCatName.trim(),
      colorHex: newCatColor,
      icon: 'Tag'
    };
    onAddCategory(cat);
    setNewCatName('');
    setCategoryError(null);
  };

  const handleDeleteCat = (id: string) => {
    const res = onDeleteCategory(id);
    if (!res.success) {
      setCategoryError(strings.categoryInUseError);
    } else {
      setCategoryError(null);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = onImportBackup(content);
        setDataMessage(success ? 'تم استيراد النسخة الاحتياطية بنجاح!' : 'ملف النسخ الاحتياطي غير صالح');
        setTimeout(() => setDataMessage(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-24 pt-3 px-3.5 sm:px-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {strings.navSettings}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          تخصيص المظهر، التصنيفات، التنبيهات والنسخ الاحتياطي
        </p>
      </div>

      {dataMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{dataMessage}</span>
        </div>
      )}

      {/* Appearance Section */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-xl shadow-black/20'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-3.5">
          <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Sun className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            {strings.settingsAppearance}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { mode: 'LIGHT', label: strings.themeLight, icon: <Sun className="w-4 h-4" /> },
            { mode: 'DARK', label: strings.themeDark, icon: <Moon className="w-4 h-4" /> },
            { mode: 'SYSTEM', label: strings.themeSystem, icon: <RefreshCw className="w-4 h-4" /> }
          ].map(t => {
            const isSel = settings.themeMode === t.mode;
            return (
              <button
                key={t.mode}
                onClick={() => onUpdateSettings({ ...settings, themeMode: t.mode as UserSettings['themeMode'] })}
                className={`py-3 px-2 rounded-2xl text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all ${
                  isSel
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language Section */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-xl shadow-black/20'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-3.5">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Globe className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            {strings.settingsLanguage}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onUpdateSettings({ ...settings, language: 'ar' })}
            className={`py-2.5 px-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all ${
              settings.language === 'ar'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20'
                : isDark
                ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>{strings.langArabic}</span>
            {settings.language === 'ar' && <Check className="w-4 h-4 stroke-[3]" />}
          </button>

          <button
            onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
            className={`py-2.5 px-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all ${
              settings.language === 'en'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20'
                : isDark
                ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>{strings.langEnglish}</span>
            {settings.language === 'en' && <Check className="w-4 h-4 stroke-[3]" />}
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-xl shadow-black/20'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {strings.settingsNotifications}
            </h2>
          </div>
          <button
            onClick={handleTestSound}
            className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>تجربة نغمة التنبيه</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {strings.enableNotifications}
            </span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={e =>
                onUpdateSettings({ ...settings, notificationsEnabled: e.target.checked })
              }
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {strings.soundEnabled}
            </span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={e => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {strings.vibrationEnabled}
            </span>
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={e => onUpdateSettings({ ...settings, vibrationEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Category Management */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-xl shadow-black/20'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-3.5">
          <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Tag className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            تصنيفات المهام
          </h2>
        </div>

        {categoryError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{categoryError}</span>
          </div>
        )}

        {/* Existing Categories list */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shadow-sm"
              style={{
                backgroundColor: `${cat.colorHex}18`,
                color: cat.colorHex,
                border: `1px solid ${cat.colorHex}40`
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.colorHex }} />
              <span>{cat.name}</span>
              {!cat.isDefault && (
                <button
                  onClick={() => handleDeleteCat(cat.id)}
                  className="p-0.5 hover:opacity-75 transition-opacity ms-1"
                  title="حذف التصنيف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new category form */}
        <form onSubmit={handleCreateCategory} className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="اسم التصنيف الجديد..."
              className={`flex-1 px-3.5 py-2 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة</span>
            </button>
          </div>

          {/* Color palette selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">اللون:</span>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCatColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    newCatColor === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Data Management & Backup */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-xl shadow-black/20'
            : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-3.5">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            {strings.settingsData}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
          <button
            onClick={onExportBackup}
            className={`py-3 px-3.5 rounded-2xl flex items-center justify-center gap-2 border transition-all ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-500" />
            <span>{strings.exportData}</span>
          </button>

          <label
            className={`py-3 px-3.5 rounded-2xl flex items-center justify-center gap-2 border cursor-pointer transition-all ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-4 h-4 text-purple-500" />
            <span>{strings.importData}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            onClick={onLoadSampleData}
            className={`py-3 px-3.5 rounded-2xl flex items-center justify-center gap-2 border transition-all ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-500" />
            <span>{strings.sampleData}</span>
          </button>

          <button
            onClick={onClearData}
            className="py-3 px-3.5 rounded-2xl flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{strings.clearSampleData}</span>
          </button>
        </div>
      </div>

      {/* Android APK Build & Export Section */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          isDark
            ? 'bg-gradient-to-br from-emerald-950/30 to-slate-900 border-emerald-900/40 shadow-xl shadow-black/20'
            : 'bg-gradient-to-br from-emerald-50/70 to-white border-emerald-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                تطبيق أندرويد محلي (APK)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                تجميع وتنزيل حزمة التطبيق بصيغة APK والتثبيت على هاتفك
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenApkModal}
          className="w-full py-3 px-4 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Smartphone className="w-4 h-4" />
          <span>فتح أدوات ودليل بناء حزمة APK للهاتف</span>
        </button>
      </div>

      {/* About Box */}
      <div
        className={`p-4 rounded-3xl border space-y-2 text-xs transition-all ${
          isDark
            ? 'bg-slate-900/60 border-slate-800 text-slate-400'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{strings.settingsAbout}</span>
        </div>
        <p className="font-medium">{strings.appVersion}</p>
        <p className="font-medium">{strings.privacyPolicy}</p>
      </div>
    </div>
  );
};
