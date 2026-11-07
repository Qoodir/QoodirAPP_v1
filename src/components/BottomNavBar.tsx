import React from 'react';
import { Library, BookOpen, Music, Film, FileText } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'catalog' | 'manga' | 'notepad' | 'music' | 'video';
  onSelectTab: (tab: 'catalog' | 'manga' | 'notepad' | 'music' | 'video') => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab
}) => {
  const tabs = [
    { id: 'catalog', label: 'Komik', icon: Library },
    { id: 'manga', label: 'Manga CBZ', icon: BookOpen },
    { id: 'notepad', label: 'Notepad', icon: FileText },
    { id: 'music', label: 'Musik', icon: Music },
    { id: 'video', label: 'Video', icon: Film }
  ] as const;

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === activeTab));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#161925]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 transition-colors shadow-lg select-none">
      <div className="relative max-w-md mx-auto px-2 py-1 flex items-center justify-between">
        {/* Sliding Active Pill Background */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-xl bg-[#3DDC84]/15 dark:bg-[#3DDC84]/20 border border-[#3DDC84]/35 pointer-events-none will-change-[left]"
          style={{
            width: 'calc(20% - 6px)',
            left: `calc(${activeIndex * 20}% + 3px)`,
            transition: 'left 0.32s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        />

        {/* Sliding Bottom Accent Line */}
        <div
          className="absolute bottom-0 h-0.5 rounded-full bg-[#3DDC84] shadow-xs pointer-events-none will-change-[left]"
          style={{
            width: '24px',
            left: `calc(${activeIndex * 20}% + 10% - 12px)`,
            transition: 'left 0.32s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-btn-${tab.id}`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative z-10 w-1/5 flex flex-col items-center py-1.5 rounded-xl transition-colors duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-emerald-700 dark:text-[#3DDC84] font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`w-9 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 ${
                  isActive ? 'scale-110 text-[#0F111A] dark:text-[#3DDC84]' : 'scale-100 hover:scale-105'
                }`}
              >
                <Icon size={17} className="transition-transform duration-200" />
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider mt-0.5 whitespace-nowrap transition-colors duration-200">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
