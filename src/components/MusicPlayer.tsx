import React, { useState, useMemo } from 'react';
import {
  Upload,
  Music,
  Play,
  Trash2,
  FolderPlus,
  Disc,
  Search,
  Check,
  Folder,
  X,
  Volume2
} from 'lucide-react';
import { MusicTrackRecord } from '../types';
import { formatFileSize } from '../utils/mangaParser';

export interface MusicPlayerProps {
  tracks: MusicTrackRecord[];
  onAddTracks: (files: File[], folder: string) => Promise<void>;
  onAddCustomTrack?: (track: Omit<MusicTrackRecord, 'id'>) => Promise<void>;
  onDeleteTrack: (id: number) => Promise<void>;
  onPlayQueue: (queue: MusicTrackRecord[], startIndex?: number) => void;
  isUploadModalOpen?: boolean;
  onCloseUploadModal?: () => void;
  searchQuery?: string;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  tracks,
  onAddTracks,
  onDeleteTrack,
  onPlayQueue,
  isUploadModalOpen,
  onCloseUploadModal,
  searchQuery: externalSearchQuery
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('ALL');

  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const deferredSearch = React.useDeferredValue(activeSearch);

  // Upload modal state
  const [internalUploadModalOpen, setInternalUploadModalOpen] = useState(false);
  const isModalOpen = isUploadModalOpen !== undefined ? isUploadModalOpen : internalUploadModalOpen;

  const closeModal = () => {
    if (onCloseUploadModal) onCloseUploadModal();
    setInternalUploadModalOpen(false);
    setSelectedFiles([]);
  };

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFolder, setTargetFolder] = useState('Favorit');
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Delete modal state
  const [trackToDelete, setTrackToDelete] = useState<MusicTrackRecord | null>(null);
  const [isDeletingTrack, setIsDeletingTrack] = useState(false);

  // Folders list
  const existingFolders = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => set.add(t.folder || 'Favorit'));
    if (!set.has('Favorit')) set.add('Favorit');
    return Array.from(set).sort();
  }, [tracks]);

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    let result = [...tracks];
    const q = deferredSearch.trim().toLowerCase();

    if (selectedFolderFilter !== 'ALL') {
      result = result.filter((t) => (t.folder || 'Favorit') === selectedFolderFilter);
    }

    if (q) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.fileName.toLowerCase().includes(q) ||
          (t.folder || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [tracks, selectedFolderFilter, deferredSearch]);

  // Group filtered tracks by folder
  const groupedTracks = useMemo(() => {
    const map: Record<string, MusicTrackRecord[]> = {};
    filteredTracks.forEach((t) => {
      const f = t.folder || 'Favorit';
      if (!map[f]) map[f] = [];
      map[f].push(t);
    });
    return map;
  }, [filteredTracks]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSaveTracks = async () => {
    if (selectedFiles.length === 0) {
      alert('Pilih file musik audio terlebih dahulu!');
      return;
    }

    let finalFolder = targetFolder;
    if (targetFolder === '__NEW__') {
      if (!newFolderName.trim()) {
        alert('Tuliskan nama folder baru!');
        return;
      }
      finalFolder = newFolderName.trim();
    }

    setIsUploading(true);
    try {
      await onAddTracks(selectedFiles, finalFolder);
      setSelectedFiles([]);
      setNewFolderName('');
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan file musik.');
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!trackToDelete || trackToDelete.id === undefined) return;
    setIsDeletingTrack(true);
    try {
      await onDeleteTrack(trackToDelete.id);
      setTrackToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus lagu.');
    } finally {
      setIsDeletingTrack(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Folder Filters & Quick Play Bar */}
      <div className="bg-white dark:bg-[#161925] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedFolderFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                selectedFolderFilter === 'ALL'
                  ? 'bg-[#3DDC84] text-[#0F111A] shadow-xs'
                  : 'bg-slate-100 dark:bg-[#12141F] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              SEMUA ({tracks.length})
            </button>
            {existingFolders.map((f) => {
              const count = tracks.filter((t) => (t.folder || 'Favorit') === f).length;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFolderFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                    selectedFolderFilter === f
                      ? 'bg-[#3DDC84] text-[#0F111A] shadow-xs'
                      : 'bg-slate-100 dark:bg-[#12141F] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  📁 {f} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              TOTAL: <span className="font-bold text-[#3DDC84]">{tracks.length}</span> LAGU
            </div>

            {filteredTracks.length > 0 && (
              <button
                type="button"
                onClick={() => onPlayQueue(filteredTracks, 0)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#3DDC84]/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#3DDC84] text-xs font-mono font-bold tracking-tight shadow-xs transition-all cursor-pointer"
                title="Putar semua lagu yang tampil"
              >
                <Play size={12} fill="currentColor" />
                <span>PUTAR SEMUA</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Pop Up Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => {
            if (!isUploading) closeModal();
          }}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#161925] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1C202F]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#3DDC84] rounded-lg flex items-center justify-center text-[#0F111A]">
                  <Upload size={14} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                    UPLOAD MUSIK OFFLINE
                  </h3>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    Mendukung format MP3, WAV, M4A, FLAC, OGG, AAC
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isUploading) closeModal();
                }}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer"
                title="Tutup pop up"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 overflow-y-auto">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                Pilih satu atau beberapa file lagu audio dari perangkat Anda, lalu tentukan folder playlist untuk disimpan ke penyimpanan offline browser.
              </p>

              {/* File input */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] space-y-2 text-center">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                  1. PILIH FILE AUDIO:
                </label>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac"
                  multiple
                  onChange={handleFileChange}
                  className="w-full text-xs font-mono text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-mono file:font-bold file:bg-[#3DDC84]/20 file:text-emerald-800 dark:file:text-[#3DDC84] hover:file:bg-[#3DDC84]/30 cursor-pointer"
                />

                {selectedFiles.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-[#3DDC84] text-xs font-mono font-bold">
                    <Check size={12} />
                    <span>{selectedFiles.length} Lagu terpilih ({formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))})</span>
                  </div>
                )}
              </div>

              {/* Target folder */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Folder size={12} className="text-[#3DDC84]" />
                  2. SIMPAN KE FOLDER / PLAYLIST:
                </label>
                <select
                  value={targetFolder}
                  onChange={(e) => setTargetFolder(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden"
                >
                  {existingFolders.map((f) => (
                    <option key={f} value={f}>
                      📁 {f}
                    </option>
                  ))}
                  <option value="__NEW__">➕ Buat Folder / Playlist Baru...</option>
                </select>

                {targetFolder === '__NEW__' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Nama Folder Baru (cth: Anime OST, Lofi Chill)..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1C202F]">
              <button
                type="button"
                onClick={closeModal}
                disabled={isUploading}
                className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleSaveTracks}
                disabled={selectedFiles.length === 0 || isUploading}
                className="py-2 px-4 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] disabled:opacity-50 text-[#0F111A] text-xs font-mono font-bold tracking-tight shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FolderPlus size={14} className="stroke-[2.5]" />
                <span>{isUploading ? 'MENYIMPAN...' : 'SIMPAN KE PERPUSTAKAAN'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracks List */}
      {filteredTracks.length === 0 ? (
        <div className="bg-white dark:bg-[#161925] p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2.5">
          <Music size={32} className="mx-auto text-slate-400" />
          <h4 className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
            {tracks.length === 0 ? 'BELUM ADA LAGU OFFLINE' : 'TIDAK ADA LAGU YANG COCOK'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            {tracks.length === 0
              ? 'Upload file audio MP3 atau format lainnya untuk didengarkan sambil membaca komik.'
              : 'Coba ubah kata kunci pencarian atau pilih folder lain.'}
          </p>
          {tracks.length === 0 && (
            <button
              type="button"
              onClick={() => setInternalUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-xs font-mono font-bold tracking-tight shadow-xs transition-all mt-2 cursor-pointer"
            >
              <Upload size={14} className="stroke-[2.5]" />
              <span>+ UPLOAD MUSIK PERTAMA</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(Object.entries(groupedTracks) as [string, MusicTrackRecord[]][]).map(([folderName, folderTracks]) => (
            <div
              key={folderName}
              className="bg-white dark:bg-[#161925] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
            >
              {/* Folder header */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#1C202F] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder size={14} className="text-[#3DDC84]" />
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 uppercase">
                    {folderName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({folderTracks.length} lagu)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onPlayQueue(folderTracks, 0)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3DDC84]/15 hover:bg-[#3DDC84]/25 text-emerald-700 dark:text-[#3DDC84] text-[11px] font-mono font-bold transition-all cursor-pointer"
                  title={`Putar semua lagu di folder ${folderName}`}
                >
                  <Play size={11} fill="currentColor" />
                  <span>PUTAR FOLDER</span>
                </button>
              </div>

              {/* Tracks in this folder */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {folderTracks.map((track, idx) => (
                  <div
                    key={track.id ?? idx}
                    className="group px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        const globalIndex = filteredTracks.findIndex((t) => t.id === track.id);
                        onPlayQueue(filteredTracks, globalIndex >= 0 ? globalIndex : 0);
                      }}
                    >
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#12141F] group-hover:bg-[#3DDC84] text-slate-600 dark:text-slate-300 group-hover:text-[#0F111A] flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
                        title="Putar lagu ini"
                      >
                        <Play size={13} fill="currentColor" className="ml-0.5" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#3DDC84] transition-colors">
                          {track.title}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {track.fileName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
                        {formatFileSize(track.fileData?.size || 0)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrackToDelete(track);
                        }}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors cursor-pointer"
                        title="Hapus lagu"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {trackToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => {
            if (!isDeletingTrack) setTrackToDelete(null);
          }}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#161925] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <Trash2 size={18} />
              <h3 className="text-sm font-mono font-bold uppercase">HAPUS LAGU OFFLINE</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
              Apakah Anda yakin ingin menghapus lagu{' '}
              <strong className="text-slate-900 dark:text-white font-mono font-bold">
                "{trackToDelete.title}"
              </strong>{' '}
              dari memori lokal?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTrackToDelete(null)}
                disabled={isDeletingTrack}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeletingTrack}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold transition-colors shadow-xs"
              >
                {isDeletingTrack ? 'MENGHAPUS...' : 'YA, HAPUS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
