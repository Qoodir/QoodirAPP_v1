import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Database,
  BookOpen,
  Layers,
  CheckCircle2,
  Code2,
  BarChart3,
  Smartphone,
  Download,
  ArrowRight
} from 'lucide-react';
import { KotlinAndroidProjectViewer } from './KotlinAndroidProjectViewer';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalComics: number;
  totalVolumesOwned: number;
  totalVolumesTotal: number;
  percentOwned: number;
  initialTab?: 'summary' | 'kotlin';
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  totalComics,
  totalVolumesOwned,
  totalVolumesTotal,
  percentOwned,
  initialTab = 'summary'
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'kotlin'>(initialTab);

  // Sync tab when modal opens with initialTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#161925] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#12141F]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3DDC84] rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-[#3DDC84]/25">
              <div className="w-3.5 h-3.5 bg-[#0F111A] rotate-45 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#3DDC84] rotate-45"></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                RINGKASAN & KOTLIN APP
              </h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Statistik Koleksi, Enkripsi DB & Source Code Android
              </p>
            </div>
          </div>

          <button
            id="btn-close-stats-modal"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F111A] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="px-5 py-2.5 bg-slate-100/80 dark:bg-[#0F111A] border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-[#161925] text-emerald-700 dark:text-[#3DDC84] shadow-xs border border-slate-200 dark:border-[#3DDC84]/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 size={15} />
            <span>RINGKASAN & STATISTIK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kotlin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'kotlin'
                ? 'bg-white dark:bg-[#161925] text-emerald-700 dark:text-[#3DDC84] shadow-xs border border-slate-200 dark:border-[#3DDC84]/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Code2 size={15} />
            <span>KOTLIN ANDROID APP</span>
            <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-[#3DDC84]">
              SRC CODE
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'summary' ? (
            <div className="space-y-3.5">
              {/* 1. Total Judul */}
              <div className="bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-slate-400" />
                    <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-[0.2em]">
                      TOTAL JUDUL
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-[#3DDC84] bg-emerald-500/10 px-2 py-0.5 rounded">
                    ACTIVE
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-light text-slate-900 dark:text-white font-mono">
                    {totalComics}
                  </p>
                  <span className="text-xs font-mono text-slate-400">Koleksi Komik Terdaftar</span>
                </div>
                <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#3DDC84] transition-all duration-500" 
                    style={{ width: totalComics > 0 ? '100%' : '0%' }}
                  ></div>
                </div>
              </div>

              {/* 2. Volume Koleksi */}
              <div className="bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Layers size={13} className="text-slate-400" />
                    <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-[0.2em]">
                      VOLUME KOLEKSI
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                    {percentOwned}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-light text-slate-900 dark:text-white font-mono">
                    {totalVolumesOwned}{' '}
                    <span className="text-sm font-normal text-slate-400 font-sans">
                      / {totalVolumesTotal}
                    </span>
                  </p>
                  <span className="text-xs font-mono text-slate-400">Buku Dimiliki</span>
                </div>
                <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${percentOwned}%` }}
                  ></div>
                </div>
              </div>

              {/* 3. Keamanan DB */}
              <div className="bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Database size={13} className="text-slate-400" />
                    <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-[0.2em]">
                      KEAMANAN DB
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#3DDC84] bg-[#3DDC84]/15 px-2 py-0.5 rounded border border-[#3DDC84]/30">
                    AES-256
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-light text-slate-900 dark:text-white font-mono">
                    SQLCipher
                  </p>
                  <span className="text-[11px] font-mono text-[#3DDC84] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Terenkripsi
                  </span>
                </div>
                <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#3DDC84] shadow-[0_0_8px_rgba(61,220,132,0.6)]"></div>
                </div>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Data lokal dienkripsi menggunakan standar militer AES-256 (Room ORM + SQLCipher library) untuk privasi maksimal.
                </p>
              </div>

              {/* Switch to Kotlin App CTA card */}
              <div 
                onClick={() => setActiveTab('kotlin')}
                className="group p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-[#3DDC84]/5 to-transparent border border-emerald-500/30 hover:border-[#3DDC84] transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#3DDC84] text-[#0F111A] flex items-center justify-center font-bold shrink-0">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Proyek Kotlin Android Studio</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#3DDC84]/20 text-emerald-800 dark:text-[#3DDC84]">
                        Tersedia
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Unduh source code lengkap (.ZIP) dan lihat kode Room DB & Jetpack Compose
                    </p>
                  </div>
                </div>
                <div className="text-emerald-600 dark:text-[#3DDC84] group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <KotlinAndroidProjectViewer />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#12141F] flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-400">
            {activeTab === 'summary' ? 'Koleksi Komik & Enkripsi DB' : 'Android Studio Kotlin & Room DB'}
          </div>

          <button
            id="btn-confirm-close-stats"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] active:scale-95 text-[#0F111A] text-xs font-mono font-bold uppercase tracking-tight shadow-xs transition-all cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
