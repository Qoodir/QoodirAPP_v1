import React, { useState, useMemo } from 'react';
import { Search, FolderOpen, Trash2, ArrowUp, ArrowDown, BookMarked, CheckCircle2 } from 'lucide-react';
import { ComicItem, OwnedVolumesMap } from '../types';

interface ComicCatalogProps {
  comics: ComicItem[];
  ownedVolumes: OwnedVolumesMap;
  onSelectComic: (comic: ComicItem) => void;
  onDeleteComic: (id: number) => void;
  onMoveOrder: (index: number, direction: 'up' | 'down') => void;
  onOpenLinkedFolder: (folderName: string) => void;
  onOpenAddModal: () => void;
}

export const ComicCatalog: React.FC<ComicCatalogProps> = ({
  comics,
  ownedVolumes,
  onSelectComic,
  onDeleteComic,
  onMoveOrder,
  onOpenLinkedFolder,
  onOpenAddModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bindup' | 'completed' | 'ongoing'>('all');

  const filteredComics = useMemo(() => {
    let result = [...comics];
    const query = searchQuery.trim().toLowerCase();

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
    } else if (filterType === 'completed') {
      result = result.filter((c) => {
        const owned = ownedVolumes[c.id] || [];
        const validOwned = owned.filter((v) => v <= c.totalVolumes);
        return validOwned.length === c.totalVolumes && c.totalVolumes > 0;
      });
    } else if (filterType === 'ongoing') {
      result = result.filter((c) => {
        const owned = ownedVolumes[c.id] || [];
        const validOwned = owned.filter((v) => v <= c.totalVolumes);
        return validOwned.length < c.totalVolumes;
      });
    }

    return result;
  }, [comics, ownedVolumes, searchQuery, filterType]);

  const totalVolumesOwned = useMemo(() => {
    let count = 0;
    comics.forEach((c) => {
      const owned = ownedVolumes[c.id] || [];
      count += owned.filter((v) => v <= c.totalVolumes).length;
    });
    return count;
  }, [comics, ownedVolumes]);

  return (
    <div className="space-y-4 pb-24">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#161925] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <input
            id="input-search-comics"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul komik, akasha, atau author..."
            className="w-full pl-10 pr-16 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono placeholder:font-sans focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden transition-colors"
          />
          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={15} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="filter-chip-all"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-[#3DDC84] text-[#0F111A] shadow-xs'
                  : 'bg-slate-100 dark:bg-[#12141F] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              SEMUA ({comics.length})
            </button>
            <button
              id="filter-chip-bindup"
              onClick={() => setFilterType('bindup')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                filterType === 'bindup'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#12141F] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              BIND-UP ({comics.filter((c) => c.type === 'bindup').length})
            </button>
            <button
              id="filter-chip-completed"
              onClick={() => setFilterType('completed')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                filterType === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#12141F] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              TUNTAS SELESAI
            </button>
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

            return (
              <div
                key={comic.id}
                id={`comic-card-${comic.id}`}
                onClick={() => onSelectComic(comic)}
                className="group bg-white dark:bg-[#161925] border border-slate-200 dark:border-slate-800 hover:border-[#3DDC84]/60 p-3.5 rounded-xl shadow-xs transition-all cursor-pointer relative"
              >
                {/* Actions row: reorder + delete */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button
                    type="button"
                    title="Geser ke atas"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveOrder(index, 'up');
                    }}
                    disabled={index === 0}
                    className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-20 flex items-center justify-center transition-all"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    title="Geser ke bawah"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveOrder(index, 'down');
                    }}
                    disabled={index === filteredComics.length - 1}
                    className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-20 flex items-center justify-center transition-all"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    title="Hapus komik"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteComic(comic.id);
                    }}
                    className="w-6 h-6 rounded border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all ml-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Comic Information */}
                <div className="pr-20">
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

                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                        📦 {validOwned.length}/{comic.totalVolumes} VOL
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
