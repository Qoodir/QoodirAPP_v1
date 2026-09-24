import React from 'react';
import { Library, BookOpen, Music, Film, FileText } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'catalog' | 'manga' | 'music' | 'video' | 'notepad';
  onSelectTab: (tab: 'catalog' | 'manga' | 'music' | 'video' | 'notepad') => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab
}) => {
  const tabs = [
    { id: 'catalog', label: 'Komik', icon: Library },
    { id: 'manga', label: 'Manga CBZ', icon: BookOpen },
    { id: 'music', label: 'Musik', icon: Music },
    { id: 'video', label: 'Video', icon: Film },
    { id: 'notepad', label: 'Notepad', icon: FileText }
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#161925]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 transition-colors shadow-lg">
      <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-btn-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center py-1.5 px-3 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-emerald-700 dark:text-[#3DDC84] font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`w-9 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-[#3DDC84]/15 dark:bg-[#3DDC84]/20 border border-[#3DDC84]/40 text-[#0F111A] dark:text-[#3DDC84] scale-110 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:scale-105'
                }`}
              >
                <Icon size={17} className="transition-transform duration-200" />
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider mt-1 whitespace-nowrap transition-colors duration-200">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-[#3DDC84] shadow-xs transition-all duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
