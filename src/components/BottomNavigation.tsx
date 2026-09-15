import React from 'react';
import { Home, CheckSquare, Calendar, BarChart3, Settings } from 'lucide-react';
import { TabType } from '../types';
import { LocaleStrings } from '../locales/strings';

interface BottomNavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  strings: LocaleStrings;
  isDark: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  strings,
  isDark
}) => {
  const tabs: { type: TabType; label: string; icon: React.ReactNode }[] = [
    { type: 'HOME', label: strings.navHome, icon: <Home className="w-5 h-5" /> },
    { type: 'TASKS', label: strings.navTasks, icon: <CheckSquare className="w-5 h-5" /> },
    { type: 'CALENDAR', label: strings.navCalendar, icon: <Calendar className="w-5 h-5" /> },
    { type: 'STATISTICS', label: strings.navStatistics, icon: <BarChart3 className="w-5 h-5" /> },
    { type: 'SETTINGS', label: strings.navSettings, icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Main Navigation"
      className={`fixed bottom-0 left-0 right-0 z-30 border-t ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-400'
          : 'bg-white/90 border-slate-200/80 text-slate-500'
      } backdrop-blur-xl transition-all duration-300`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map(tab => {
          const isActive = currentTab === tab.type;
          return (
            <button
              key={tab.type}
              id={`nav-tab-${tab.type.toLowerCase()}`}
              onClick={() => onSelectTab(tab.type)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-all group relative"
            >
              <div
                className={`flex items-center justify-center w-12 h-7 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25 scale-105'
                    : isDark
                    ? 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/50'
                    : 'text-slate-500 group-hover:text-slate-800 group-hover:bg-slate-100/70'
                }`}
              >
                {tab.icon}
              </div>
              <span
                className={`text-[10px] mt-1 font-bold tracking-tight transition-colors duration-200 ${
                  isActive
                    ? isDark
                      ? 'text-indigo-400 font-black'
                      : 'text-indigo-600 font-black'
                    : 'text-inherit'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
