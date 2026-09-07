import React from 'react';
import { X, CheckCircle2, Folder, Layers, CheckSquare, Square } from 'lucide-react';
import { ComicItem } from '../types';

interface ComicDetailModalProps {
  comic: ComicItem | null;
  ownedVolumes: number[];
  availableFolders: string[];
  isOpen: boolean;
  onClose: () => void;
  onToggleVolume: (comicId: number, volume: number) => void;
  onSelectAllVolumes: (comicId: number, total: number) => void;
  onClearAllVolumes: (comicId: number) => void;
  onUpdateTotalVolumes: (comicId: number, total: number) => void;
  onUpdateFolderLink: (comicId: number, folder: string) => void;
}

export const ComicDetailModal: React.FC<ComicDetailModalProps> = ({
  comic,
  ownedVolumes,
  availableFolders,
  isOpen,
  onClose,
  onToggleVolume,
  onSelectAllVolumes,
  onClearAllVolumes,
  onUpdateTotalVolumes,
  onUpdateFolderLink
}) => {
  if (!isOpen || !comic) return null;

  const validOwned = ownedVolumes.filter((v) => v <= comic.totalVolumes);
  const isCompleted = validOwned.length === comic.totalVolumes && comic.totalVolumes > 0;
  const percentage = Math.round((validOwned.length / comic.totalVolumes) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#161925] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1C202F]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight font-mono">
                {comic.title}
              </h2>
              {comic.type === 'bindup' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 uppercase">
                  BIND-UP
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-[#3DDC84] border border-emerald-500/30 uppercase">
                  <CheckCircle2 size={10} /> COMPLETED
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              AUTHOR: <span className="font-semibold text-slate-700 dark:text-slate-300">{comic.author}</span>
            </p>
          </div>
          <button
            id="btn-close-detail-modal"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Progress Card */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#12141F] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Status Koleksi Volume
              </p>
              <p className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                📦 {validOwned.length} / {comic.totalVolumes} VOL DIMILIKI ({percentage}%)
              </p>
              <div className="mt-2 h-1 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-select-all-vols"
                onClick={() => onSelectAllVolumes(comic.id, comic.totalVolumes)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold bg-white dark:bg-[#161925] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#3DDC84]/50 shadow-xs"
              >
                <CheckSquare size={13} className="text-[#3DDC84]" />
                SEMUA
              </button>
              <button
                id="btn-clear-all-vols"
                onClick={() => onClearAllVolumes(comic.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold bg-white dark:bg-[#161925] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 shadow-xs"
              >
                <Square size={13} className="text-slate-400" />
                RESET
              </button>
            </div>
          </div>

          {/* Settings: Total Volumes & Link Folder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Layers size={13} /> Ubah Total Volume Rilis
              </label>
              <input
                id="input-detail-total-vol"
                type="number"
                min="1"
                max="999"
                value={comic.totalVolumes}
                onChange={(e) => onUpdateTotalVolumes(comic.id, Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Folder size={13} /> Hubungkan Folder Manga
              </label>
              <select
                id="select-detail-folder-link"
                value={comic.mangaLinkFolder || ''}
                onChange={(e) => onUpdateFolderLink(comic.id, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden"
              >
                <option value="">-- Tanpa Relasi Folder --</option>
                {availableFolders.map((f) => (
                  <option key={f} value={f}>
                    📁 {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist Grid */}
          <div>
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 mb-2">
              📙 Centang Volume Yang Anda Miliki:
            </h4>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
              {Array.from({ length: comic.totalVolumes }, (_, i) => i + 1).map((vol) => {
                const isOwned = validOwned.includes(vol);
                return (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => onToggleVolume(comic.id, vol)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-mono font-bold border transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 ${
                      isOwned
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-400 dark:border-amber-600/60 text-amber-900 dark:text-amber-300 shadow-2xs'
                        : 'bg-slate-50 dark:bg-[#12141F] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c202f]'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-xs border flex items-center justify-center text-[9px] ${isOwned ? 'bg-amber-500 border-amber-500 text-[#0F111A] font-bold' : 'border-slate-400'}`}>
                      {isOwned && '✓'}
                    </span>
                    Vol {vol}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1C202F] flex justify-end">
          <button
            id="btn-close-detail"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] font-mono font-bold text-xs uppercase tracking-tight shadow-xs transition-colors"
          >
            SELESAI
          </button>
        </div>
      </div>
    </div>
  );
};
