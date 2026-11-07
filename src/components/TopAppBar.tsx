import React, { useState } from 'react';
import {
  BookOpen,
  Moon,
  Sun,
  ChevronDown,
  Film,
  Disc,
  Plus,
  BarChart3,
  Search
} from 'lucide-react';
import { FloatingMusicPlayer } from './FloatingMusicPlayer';
import { MusicTrackRecord } from '../types';

interface TopAppBarProps {
  activeTab: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAddComic: () => void;
  onOpenUploadManga: () => void;
  onOpenUploadMusic: () => void;
  onOpenUploadVideo: () => void;
  onOpenStats?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  musicQueue?: MusicTrackRecord[];
  musicQueueIndex?: number;
  isMusicPlayerOpen?: boolean;
  onCloseMusicPlayer?: () => void;
  onOpenMusicPlayer?: () => void;
  onNextMusicTrack?: () => void;
  onPrevMusicTrack?: () => void;
  onOpenMusicTab?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  activeTab,
  isDark,
  onToggleTheme,
  onOpenAddComic,
  onOpenUploadManga,
  onOpenUploadMusic,
  onOpenUploadVideo,
  onOpenStats,
  searchQuery = '',
  onSearchChange = (_query: string) => {},
  musicQueue = [],
  musicQueueIndex = 0,
  isMusicPlayerOpen = false,
  onCloseMusicPlayer = () => {},
  onOpenMusicPlayer,
  onNextMusicTrack = () => {},
  onPrevMusicTrack = () => {},
  onOpenMusicTab
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'catalog':
        return 'Cari judul komik, akasha, atau author...';
      case 'manga':
        return 'Cari judul manga, berkas, atau bab...';
      case 'music':
        return 'Cari judul lagu, nama berkas, atau folder...';
      case 'video':
        return 'Cari judul berkas video atau folder...';
      case 'notepad':
        return 'Cari catatan, wishlist, atau review...';
      default:
        return 'Cari di sini...';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#161925]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2.5">
        {/* Integrated Top-Left Corner Menu (Logo + Menu Trigger) */}
        <div className="relative shrink-0">
          <button
            id="btn-corner-app-menu"
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title="Menu Pojok Kiri (Upload & Pengaturan)"
            className="group relative w-9 h-9 bg-[#3DDC84] hover:bg-[#32c974] active:scale-90 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-[#3DDC84]/25 transition-all cursor-pointer"
          >
            <div className="w-4 h-4 bg-[#0F111A] rotate-45 flex items-center justify-center group-hover:scale-110 transition-transform">
              <div className="w-1.5 h-1.5 bg-[#3DDC84] rotate-45"></div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 bg-[#0F111A] rounded-full border border-emerald-400 items-center justify-center shadow-xs">
              <ChevronDown
                size={10}
                className={`text-[#3DDC84] stroke-[3] transition-transform duration-200 ${
                  isMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </span>
          </button>

          {/* Dropdown Menu directly pinned to the top-left corner */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#161925] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
                {/* Menu Header */}
                <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    MENU POJOK KIRI
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-[#3DDC84] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    eQoodir
                  </span>
                </div>

                {/* Section: Upload & Tambah */}
                <div className="px-2.5 pt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  UNGGAH & TAMBAH
                </div>

                <button
                  id="menu-item-upload-manga"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenUploadManga();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-[#3DDC84] flex items-center justify-center shrink-0">
                    <BookOpen size={13} />
                  </div>
                  <div>
                    <div className="font-bold">Upload Manga / CBZ</div>
                    <div className="text-[10px] text-slate-400">PDF, ZIP, CBZ offline</div>
                  </div>
                </button>

                <button
                  id="menu-item-upload-music"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenUploadMusic();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-[#3DDC84] flex items-center justify-center shrink-0">
                    <Disc size={13} />
                  </div>
                  <div>
                    <div className="font-bold">Upload Musik</div>
                    <div className="text-[10px] text-slate-400">MP3, WAV, M4A audio</div>
                  </div>
                </button>

                <button
                  id="menu-item-upload-video"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenUploadVideo();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-[#3DDC84] flex items-center justify-center shrink-0">
                    <Film size={13} />
                  </div>
                  <div>
                    <div className="font-bold">Buka / Upload Video</div>
                    <div className="text-[10px] text-slate-400">Direktori USB atau file</div>
                  </div>
                </button>

                <button
                  id="menu-item-add-comic"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAddComic();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-[#3DDC84] flex items-center justify-center shrink-0">
                    <Plus size={13} className="stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-bold">Tambah Komik Baru</div>
                    <div className="text-[10px] text-slate-400">Katalog koleksi baru</div>
                  </div>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                {/* Section: Pengaturan & Tema */}
                <div className="px-2.5 pt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  PENGATURAN & TEMA
                </div>

                <button
                  id="menu-item-toggle-theme"
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      {isDark ? <Sun size={13} /> : <Moon size={13} />}
                    </div>
                    <div>
                      <div className="font-bold">{isDark ? 'Mode Terang' : 'Mode Gelap'}</div>
                      <div className="text-[10px] text-slate-400">Ganti tema tampilan</div>
                    </div>
                  </div>
                </button>

                {onOpenStats && (
                  <button
                    id="menu-item-stats"
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenStats();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                      <BarChart3 size={13} />
                    </div>
                    <div>
                      <div className="font-bold">Statistik & Database</div>
                      <div className="text-[10px] text-slate-400">Status volume & media</div>
                    </div>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* The ONLY other element at the top: SEARCH BAR */}
        <div className="flex-1 relative">
          <input
            id="top-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={getSearchPlaceholder()}
            className="w-full pl-9 pr-14 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono placeholder:font-sans focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden transition-colors"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
          {searchQuery && (
            <button
              id="btn-clear-top-search"
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-[11px] font-mono font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1 py-0.5 rounded cursor-pointer"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Floating Music Player (displays when active, keeps audio streaming alive) */}
        <FloatingMusicPlayer
          queue={musicQueue}
          currentIndex={musicQueueIndex}
          isOpen={isMusicPlayerOpen}
          onClose={onCloseMusicPlayer}
          onOpen={onOpenMusicPlayer}
          onNext={onNextMusicTrack}
          onPrev={onPrevMusicTrack}
          onOpenMusicTab={onOpenMusicTab}
        />
      </div>
    </header>
  );
};
