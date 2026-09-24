import React from 'react';
import { BookOpen, Moon, Sun, Plus, ShieldCheck, Smartphone } from 'lucide-react';

interface TopAppBarProps {
  activeTab: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAddComic: () => void;
  onOpenStats?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  activeTab,
  isDark,
  onToggleTheme,
  onOpenAddComic,
  onOpenStats
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'catalog':
        return 'Katalog Komik';
      case 'manga':
        return 'Manga Reader Offline';
      case 'music':
        return 'Pemutar Musik Offline';
      case 'video':
        return 'Pemutar Video';
      case 'notepad':
        return 'Notepad & Catatan';
      default:
        return 'Katalog Komik';
    }
  };

  const getTabSubtitle = () => {
    switch (activeTab) {
      case 'catalog':
        return 'Koleksi Komik';
      case 'manga':
        return 'Pembaca CBZ, ZIP & PDF offline';
      case 'music':
        return 'Pemutar audio offline & playlist';
      case 'video':
        return 'Tonton video lokal dengan subtitle';
      case 'notepad':
        return 'Catatan offline, wishlist komik & review';
      default:
        return 'Aplikasi Media & Komik Offline';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#161925]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Clickable Logo Button */}
          <button
            id="btn-app-logo-stats"
            type="button"
            onClick={onOpenStats}
            title="Klik logo untuk melihat statistik volume & keamanan database"
            className="group relative w-9 h-9 bg-[#3DDC84] hover:bg-[#32c974] active:scale-90 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-[#3DDC84]/25 transition-all cursor-pointer"
          >
            <div className="w-4 h-4 bg-[#0F111A] rotate-45 flex items-center justify-center group-hover:scale-110 transition-transform">
              <div className="w-1.5 h-1.5 bg-[#3DDC84] rotate-45"></div>
            </div>
            {/* Small pulse indicator to signify interactivity */}
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DDC84] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-[#0F111A]"></span>
            </span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {getTabTitle()}
              </h1>
              <button
                type="button"
                onClick={onOpenStats}
                title="Lihat status keamanan database"
                className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-slate-800/70 hover:bg-emerald-100 dark:hover:bg-slate-800 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-[#3DDC84] rounded-full animate-pulse"></div>
                <span className="text-[10px] font-mono font-medium text-emerald-700 dark:text-slate-300 uppercase tracking-wider">
                  SQLCipher Encrypted
                </span>
              </button>
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {getTabSubtitle()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'catalog' && (
            <button
              id="btn-add-comic-top"
              onClick={onOpenAddComic}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] active:scale-95 text-[#0F111A] text-xs font-bold shadow-xs transition-all tracking-tight"
              title="Tambah Komik Baru"
            >
              <Plus size={15} className="stroke-[3]" />
              <span className="hidden sm:inline">Tambah Komik</span>
            </button>
          )}

          <button
            id="btn-theme-toggle"
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all active:scale-95"
            title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {isDark ? <Sun size={16} className="text-[#3DDC84]" /> : <Moon size={16} className="text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
