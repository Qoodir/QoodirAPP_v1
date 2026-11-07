import React, { useState, useMemo } from 'react';
import { Search, FolderOpen, Trash2, ArrowDownAZ, BookMarked, CheckCircle2, Plus } from 'lucide-react';
import { ComicItem, OwnedVolumesMap } from '../types';

interface ComicCatalogProps {
  comics: ComicItem[];
  ownedVolumes: OwnedVolumesMap;
  onSelectComic: (comic: ComicItem) => void;
  onDeleteComic: (id: number) => void;
  onMoveOrder?: (index: number, direction: 'up' | 'down') => void;
  onOpenLinkedFolder: (folderName: string) => void;
  onOpenAddModal: () => void;
  searchQuery?: string;
}

export const ComicCatalog: React.FC<ComicCatalogProps> = ({
  comics,
  ownedVolumes,
  onSelectComic,
  onDeleteComic,
  onOpenLinkedFolder,
  onOpenAddModal,
  searchQuery: externalSearchQuery
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ongoing' | 'bindup' | 'completed'>('all');

  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const deferredSearch = React.useDeferredValue(activeSearch);

  // Check if a comic is 100% completed
  const isComicCompleted = (c: ComicItem) => {
    const owned = ownedVolumes[c.id] || [];
    const validOwned = owned.filter((v) => v <= c.totalVolumes);
    return validOwned.length === c.totalVolumes && c.totalVolumes > 0;
  };

  const ongoingCount = useMemo(() => {
    return comics.filter((c) => !isComicCompleted(c)).length;
  }, [comics, ownedVolumes]);

  const completedCount = useMemo(() => {
    return comics.filter((c) => isComicCompleted(c)).length;
  }, [comics, ownedVolumes]);

  const bindupCount = useMemo(() => {
    return comics.filter((c) => c.type === 'bindup').length;
  }, [comics]);

  const filteredComics = useMemo(() => {
    let result = [...comics];
    const query = deferredSearch.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.author.toLowerCase().includes(query) ||
          (query.includes('akasha') && c.title.toLowerCase().includes('punpun'))
      );
    }

    if (filterType === 'bindup') {
      result = result.filter((c) => c.type === 'bindup');
    } else if (filterType === 'ongoing') {
      result = result.filter((c) => !isComicCompleted(c));
    } else if (filterType === 'completed') {
      result = result.filter((c) => isComicCompleted(c));
    }

    // Sort: Ongoing first (A-Z by title), then Completed at the very bottom (A-Z by title)
    result.sort((a, b) => {
      const compA = isComicCompleted(a);
      const compB = isComicCompleted(b);

      // Completed comics always placed at the bottom
      if (compA !== compB) {
        return compA ? 1 : -1;
      }

      // Within the same group, sort alphabetically by title (A to Z)
      return a.title.localeCompare(b.title, 'id', { sensitivity: 'base', numeric: true });
    });

    return result;
  }, [comics, ownedVolumes, deferredSearch, filterType]);

  const hasOngoingAndCompleted = useMemo(() => {
    if (filterType === 'completed' || filterType === 'ongoing') return false;
    let hasOngoing = false;
    let hasCompleted = false;
    for (const c of filteredComics) {
      if (isComicCompleted(c)) {
        hasCompleted = true;
      } else {
        hasOngoing = true;
      }
      if (hasOngoing && hasCompleted) return true;
    }
    return false;
  }, [filteredComics, filterType, ownedVolumes]);

  const totalVolumesOwned = useMemo(() => {
    let count = 0;
    comics.forEach((c) => {
      const owned = ownedVolumes[c.id] || [];
      count += owned.filter((v) => v <= c.totalVolumes).length;
    });
    return count;
  }, [comics, ownedVolumes]);

  return (
    <div className="space-y-3 pb-24">
      {/* Quick Filter Chips & Stats */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="filter-chip-all"
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#3DDC84] text-[#0F111A] shadow-xs shadow-[#3DDC84]/20'
                : 'bg-white dark:bg-[#161925] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            SEMUA ({comics.length})
          </button>
          <button
            id="filter-chip-ongoing"
            type="button"
            onClick={() => setFilterType('ongoing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
              filterType === 'ongoing'
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                : 'bg-white dark:bg-[#161925] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            ONGOING ({ongoingCount})
          </button>
          <button
            id="filter-chip-bindup"
            type="button"
            onClick={() => setFilterType('bindup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
              filterType === 'bindup'
                ? 'bg-rose-600 text-white shadow-xs shadow-rose-500/20'
                : 'bg-white dark:bg-[#161925] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            BIND-UP ({bindupCount})
          </button>
          <button
            id="filter-chip-completed"
            type="button"
            onClick={() => setFilterType('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
              filterType === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20'
                : 'bg-white dark:bg-[#161925] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            TUNTAS ({completedCount})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#161925] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-medium"
            title="Urutan otomatis: Alfabet A-Z dengan komik tamat/completed di paling bawah"
          >
            <ArrowDownAZ size={13} className="text-[#3DDC84]" />
            <span>A-Z (Tamat di Bawah)</span>
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            TOTAL: <span className="font-bold text-[#3DDC84]">{totalVolumesOwned}</span> VOL
          </div>
        </div>
      </div>

      {/* Comic List Cards */}
      {filteredComics.length === 0 ? (
        <div className="bg-white dark:bg-[#161925] p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <BookMarked size={32} className="mx-auto text-slate-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
              TIDAK ADA KOMIK DITEMUKAN
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Coba kata kunci pencarian lain atau tambahkan komik baru ke database lokal.
            </p>
          </div>
          <button
            id="btn-add-comic-empty"
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-xs font-bold font-mono tracking-tight"
          >
            + TAMBAH KOMIK BARU
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredComics.map((comic, index) => {
            const ownedList = ownedVolumes[comic.id] || [];
            const validOwned = ownedList.filter((v) => v <= comic.totalVolumes);
            const isCompleted = validOwned.length === comic.totalVolumes && comic.totalVolumes > 0;

            const isFirstCompleted =
              isCompleted &&
              hasOngoingAndCompleted &&
              (index === 0 || !isComicCompleted(filteredComics[index - 1]));

            return (
              <React.Fragment key={comic.id}>
                {/* Completed divider when transitioning from ongoing to completed comics */}
                {isFirstCompleted && (
                  <div className="pt-4 pb-2 flex items-center gap-3">
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-[#3DDC84] text-[11px] font-mono font-bold tracking-tight">
                      <CheckCircle2 size={13} className="text-emerald-600 dark:text-[#3DDC84]" />
                      <span>KOMIK TUNTAS / TAMAT ({completedCount})</span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                  </div>
                )}

                <div
                  id={`comic-card-${comic.id}`}
                  onClick={() => onSelectComic(comic)}
                  className={`group bg-white dark:bg-[#161925] border p-3.5 rounded-xl shadow-xs transition-all cursor-pointer relative ${
                    isCompleted
                      ? 'border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500/60'
                      : 'border-slate-200 dark:border-slate-800 hover:border-[#3DDC84]/60'
                  }`}
                >
                  {/* Delete action */}
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <button
                      type="button"
                      title="Hapus komik dari katalog"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteComic(comic.id);
                      }}
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] text-slate-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Comic Information */}
                  <div className="pr-12">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#3DDC84] transition-colors line-clamp-1">
                        {comic.title}
                      </h3>

                      {comic.type === 'bindup' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 uppercase">
                          BIND-UP
                        </span>
                      )}

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#3DDC84] border border-emerald-500/30 uppercase">
                          <CheckCircle2 size={10} /> COMPLETED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono line-clamp-1">
                        {comic.author}
                      </p>

                      <div className="flex items-center gap-2 shrink-0">
                        {comic.mangaLinkFolder && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenLinkedFolder(comic.mangaLinkFolder);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] hover:border-[#3DDC84]/50 hover:text-[#3DDC84] text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 transition-colors"
                            title="Lihat file bab manga di folder ini"
                          >
                            <FolderOpen size={11} />
                            FOLDER
                          </button>
                        )}

                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#3DDC84] border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          📦 {validOwned.length}/{comic.totalVolumes} VOL
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
