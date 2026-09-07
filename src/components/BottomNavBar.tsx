import React from 'react';
import { Library, BookOpen, Music, Film, Code2 } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'catalog' | 'manga' | 'music' | 'video' | 'kotlin';
  onSelectTab: (tab: 'catalog' | 'manga' | 'music' | 'video' | 'kotlin') => void;
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
    { id: 'kotlin', label: 'Kotlin App', icon: Code2 }
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
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'text-emerald-700 dark:text-[#3DDC84] font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`w-9 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#3DDC84]/15 dark:bg-[#3DDC84]/20 border border-[#3DDC84]/40 text-[#0F111A] dark:text-[#3DDC84] scale-105 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon size={17} />
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider mt-1 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
