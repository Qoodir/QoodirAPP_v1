import React, { useState } from 'react';
import {
  Upload,
  Music,
  Play,
  Shuffle,
  Folder,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Disc
} from 'lucide-react';
import { MusicTrackRecord } from '../types';
import { triggerDownload } from '../utils/mangaParser';

interface MusicPlayerProps {
  tracks: MusicTrackRecord[];
  onAddTracks: (files: File[], folder: string) => Promise<void>;
  onDeleteTrack: (id: number) => Promise<void>;
  onPlayQueue: (queue: MusicTrackRecord[], startIndex?: number) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  tracks,
  onAddTracks,
  onDeleteTrack,
  onPlayQueue
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFolder, setTargetFolder] = useState('Favorit');
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<MusicTrackRecord | null>(null);
  const [isDeletingTrack, setIsDeletingTrack] = useState(false);

  // Collect playlist folders
  const folderNames = Array.from(
    new Set(tracks.map((t) => t.folder || 'Favorit').filter(Boolean))
  ).sort();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSaveToStorage = async () => {
    if (selectedFiles.length === 0) {
      alert('Pilih file audio (.mp3, .wav, .m4a) terlebih dahulu!');
      return;
    }

    let finalFolder = targetFolder;
    if (targetFolder === '__NEW__') {
      if (!newFolderName.trim()) {
        alert('Tuliskan nama folder playlist baru!');
        return;
      }
      finalFolder = newFolderName.trim();
    }

    setIsUploading(true);
    try {
      await onAddTracks(selectedFiles, finalFolder);
      setSelectedFiles([]);
      setNewFolderName('');
      setTargetFolder(finalFolder);
      setExpandedFolders((prev) => ({ ...prev, [finalFolder]: true }));
      alert(`Berhasil menyimpan ${selectedFiles.length} file musik ke database lokal!`);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan musik.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayTemporary = () => {
    if (selectedFiles.length === 0) {
      alert('Pilih file audio terlebih dahulu!');
      return;
    }

    const tempQueue: MusicTrackRecord[] = selectedFiles.map((file) => ({
      title: file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      fileData: file,
      folder: 'Playlist Sementara',
      uploadedAt: new Date().toLocaleDateString('id-ID')
    }));

    onPlayQueue(tempQueue, 0);
  };

  const handlePlayFolder = (folderName: string) => {
    const folderTracks = tracks.filter((t) => (t.folder || 'Favorit') === folderName);
    if (folderTracks.length > 0) {
      onPlayQueue(folderTracks, 0);
    }
  };

  const handlePlayAllCombined = () => {
    if (tracks.length === 0) {
      alert('Belum ada lagu offline dalam penyimpanan.');
      return;
    }
    onPlayQueue(tracks, 0);
  };

  const toggleFolder = (fName: string) => {
    setExpandedFolders((prev) => ({ ...prev, [fName]: !prev[fName] }));
  };

  // Group by folder
  const groupedTracks: Record<string, MusicTrackRecord[]> = {};
  tracks.forEach((track) => {
    const f = track.folder || 'Favorit';
    if (!groupedTracks[f]) groupedTracks[f] = [];
    groupedTracks[f].push(track);
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Upload Box Card */}
      <div className="bg-white dark:bg-[#161925] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <div className="w-5 h-5 bg-[#3DDC84] rounded flex items-center justify-center text-[#0F111A]">
            <Music size={13} className="stroke-[2.5]" />
          </div>
          <h3 className="text-xs font-mono font-bold tracking-tight text-slate-900 dark:text-white uppercase">
            UPLOAD MUSIK OFFLINE (.MP3, .WAV, .M4A)
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
          Pilih file musik untuk diputar di background player atau simpan ke memori lokal secara aman.
        </p>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
              1. PILIH FILE AUDIO:
            </label>
            <input
              id="input-music-file"
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.flac"
              multiple
              onChange={handleFileChange}
              className="w-full text-xs font-mono text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-mono file:font-bold file:bg-[#3DDC84]/20 file:text-emerald-800 dark:file:text-[#3DDC84] hover:file:bg-[#3DDC84]/30 cursor-pointer"
            />
            {selectedFiles.length > 0 && (
              <p className="text-[11px] font-mono text-emerald-600 dark:text-[#3DDC84] font-bold mt-1">
                ✓ {selectedFiles.length} FILE AUDIO TERPILIH
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
                2. PILIH FOLDER PLAYLIST:
              </label>
              <select
                id="select-music-folder"
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden"
              >
                <option value="Favorit">⭐ Favorit</option>
                {folderNames
                  .filter((f) => f !== 'Favorit')
                  .map((f) => (
                    <option key={f} value={f}>
                      📁 {f}
                    </option>
                  ))}
                <option value="__NEW__">➕ Buat Folder Playlist Baru...</option>
              </select>
            </div>

            {targetFolder === '__NEW__' && (
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
                  NAMA PLAYLIST BARU:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Anime OST, Lofi Chill..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              id="btn-play-music-temp"
              type="button"
              onClick={handlePlayTemporary}
              disabled={selectedFiles.length === 0}
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] hover:border-[#3DDC84]/50 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Play size={13} fill="currentColor" className="text-[#3DDC84]" />
              <span>MASUKKAN PLAYLIST SAJA</span>
            </button>

            <button
              id="btn-save-music-db"
              type="button"
              onClick={handleSaveToStorage}
              disabled={selectedFiles.length === 0 || isUploading}
              className="flex-1 py-2 px-3 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] disabled:opacity-50 text-[#0F111A] text-xs font-mono font-bold tracking-tight shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <FolderPlus size={13} className="stroke-[2.5]" />
              <span>{isUploading ? 'MENYIMPAN...' : '+ SIMPAN KE DB'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Putar Semua Musik Button */}
      <button
        id="btn-play-all-music"
        type="button"
        onClick={handlePlayAllCombined}
        disabled={tracks.length === 0}
        className="w-full py-2.5 px-4 rounded-xl bg-[#3DDC84] hover:bg-[#32c974] active:scale-[0.99] disabled:opacity-50 text-[#0F111A] font-mono font-bold text-xs uppercase tracking-tight shadow-md flex items-center justify-center gap-2 transition-all"
      >
        <Shuffle size={15} />
        <span>PUTAR SEMUA MUSIK GABUNGAN [{tracks.length} LAGU]</span>
      </button>

      {/* Music Playlist Folders */}
      {Object.keys(groupedTracks).length === 0 ? (
        <div className="bg-white dark:bg-[#161925] p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Disc size={32} className="mx-auto text-slate-400" />
          <h4 className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
            BELUM ADA LAGU OFFLINE TERSIMPAN
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Upload file MP3 di atas untuk menikmati pemutar musik offline lokal.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedTracks).map(([folderName, folderTracks]) => {
            const isExpanded = expandedFolders[folderName] !== false;

            return (
              <div
                key={folderName}
                className="bg-white dark:bg-[#161925] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleFolder(folderName)}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1C202F] transition-colors border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <Folder size={16} className="text-[#3DDC84]" />
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {folderName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      [{folderTracks.length} LAGU]
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayFolder(folderName);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-[10px] font-mono font-bold shadow-xs transition-colors"
                    >
                      <Play size={10} fill="currentColor" />
                      PUTAR FOLDER
                    </button>
                    <span className="text-slate-400">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </div>

                {/* Track Items */}
                {isExpanded && (
                  <div className="p-3 bg-slate-50/50 dark:bg-[#0F111A]/40 space-y-2">
                    {folderTracks.map((track, trackIdx) => (
                      <div
                        key={track.id || track.fileName}
                        className="p-3 rounded-lg bg-white dark:bg-[#161925] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs hover:border-[#3DDC84]/50 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-[#3DDC84] flex items-center justify-center shrink-0">
                            <Music size={14} />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate" title={track.title}>
                              {track.title}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {track.fileName} • {track.uploadedAt}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            id={`btn-play-track-${track.id}`}
                            onClick={() => onPlayQueue(folderTracks, trackIdx)}
                            className="px-3 py-1.5 rounded bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-xs font-mono font-bold shadow-xs transition-colors"
                          >
                            PUTAR
                          </button>
                          <button
                            onClick={() => triggerDownload(track.fileData, track.fileName)}
                            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] hover:text-slate-900 dark:hover:text-slate-200 text-slate-500 transition-colors"
                            title="Download Lagu ke Perangkat"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            onClick={() => setTrackToDelete(track)}
                            className="p-1.5 rounded border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                            title="Hapus Lagu"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Konfirmasi Hapus Musik */}
      {trackToDelete && (
        <div
          id="modal-confirm-delete-track"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeletingTrack) setTrackToDelete(null);
          }}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#161925] rounded-2xl shadow-2xl border border-rose-500/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 text-center space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>

              <div className="space-y-1">
                <h4 className="font-mono font-bold text-sm uppercase text-slate-900 dark:text-white">
                  HAPUS LAGU DARI PLAYLIST?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  File musik ini akan dihapus secara permanen dari penyimpanan offline database lokal browser Anda.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-left">
                <p
                  className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate whitespace-nowrap block"
                  title={trackToDelete.title}
                >
                  🎵 {trackToDelete.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1 truncate">
                  <span>📁 {trackToDelete.folder || 'Favorit'}</span>
                  <span>•</span>
                  <span>
                    {trackToDelete.fileData
                      ? `${(trackToDelete.fileData.size / (1024 * 1024)).toFixed(2)} MB`
                      : 'File Audio'}
                  </span>
                  {trackToDelete.uploadedAt && (
                    <>
                      <span>•</span>
                      <span>📅 {trackToDelete.uploadedAt}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  id="btn-cancel-delete-track"
                  disabled={isDeletingTrack}
                  onClick={() => setTrackToDelete(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#12141F] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-track"
                  disabled={isDeletingTrack}
                  onClick={async () => {
                    if (trackToDelete.id !== undefined) {
                      setIsDeletingTrack(true);
                      try {
                        await onDeleteTrack(trackToDelete.id);
                        setTrackToDelete(null);
                      } catch (err) {
                        console.error('Gagal menghapus lagu:', err);
                      } finally {
                        setIsDeletingTrack(false);
                      }
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  <span>{isDeletingTrack ? 'MENGHAPUS...' : 'HAPUS'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
