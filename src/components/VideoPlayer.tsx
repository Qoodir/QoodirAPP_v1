import React, { useState } from 'react';
import { Film, Upload, FolderSearch, Play, Subtitles, Clock, AlertCircle, X, Search } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoPlayerProps {
  onPlayVideo: (name: string, blob: Blob, subText: string | null, subName?: string) => void;
  isUploadModalOpen?: boolean;
  onCloseUploadModal?: () => void;
  searchQuery?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  onPlayVideo,
  isUploadModalOpen,
  onCloseUploadModal,
  searchQuery: externalSearchQuery
}) => {
  const [videoList, setVideoList] = useState<VideoItem[]>([]);
  const [videoCache, setVideoCache] = useState<Record<string, File>>({});
  const [subtitleCache, setSubtitleCache] = useState<Record<string, File>>({});
  const [selectedFolder, setSelectedFolder] = useState('ALL');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [internalUploadModalOpen, setInternalUploadModalOpen] = useState(false);

  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const deferredSearch = React.useDeferredValue(activeSearch);

  const isModalOpen = isUploadModalOpen !== undefined ? isUploadModalOpen : internalUploadModalOpen;
  const closeModal = () => {
    if (onCloseUploadModal) onCloseUploadModal();
    setInternalUploadModalOpen(false);
  };

  const handleDirectoryPicker = async () => {
    // Check if showDirectoryPicker is supported
    if (!('showDirectoryPicker' in window)) {
      alert('Browser Anda tidak mendukung Web Directory Picker API. Silakan gunakan tombol "Upload File Video".');
      return;
    }

    try {
      setIsScanning(true);
      // @ts-ignore
      const dirHandle = await (window as any).showDirectoryPicker();

      const newVideos: Record<string, File> = { ...videoCache };
      const newSubs: Record<string, File> = { ...subtitleCache };
      const newItems: VideoItem[] = [...videoList];

      for await (const rawEntry of (dirHandle as any).values()) {
        const entry = rawEntry as { kind: string; name: string; getFile: () => Promise<File> };
        if (entry.kind === 'file') {
          const nameLower = entry.name.toLowerCase();
          if (nameLower.match(/\.(mp4|mkv|webm|avi|mov)$/)) {
            const file: File = await entry.getFile();
            newVideos[entry.name] = file;
            if (!newItems.some((v) => v.name === entry.name)) {
              newItems.push({
                name: entry.name,
                folder: 'Folder USB/Perangkat',
                file,
                size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
              });
            }
          } else if (nameLower.match(/\.(srt|vtt)$/)) {
            const file: File = await entry.getFile();
            newSubs[entry.name] = file;
          }
        }
      }

      setVideoCache(newVideos);
      setSubtitleCache(newSubs);
      setVideoList(newItems);
      closeModal();
      alert(`Berhasil memindai file video dan subtitle dari folder direktori!`);
    } catch (err) {
      console.log('Directory selection was cancelled or failed', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray: File[] = Array.from(e.target.files);
    const newVideos: Record<string, File> = { ...videoCache };
    const newSubs: Record<string, File> = { ...subtitleCache };
    const newItems: VideoItem[] = [...videoList];

    filesArray.forEach((file: File) => {
      const nameLower = file.name.toLowerCase();
      if (nameLower.match(/\.(mp4|mkv|webm|avi|mov)$/)) {
        newVideos[file.name] = file;
        if (!newItems.some((v) => v.name === file.name)) {
          newItems.push({
            name: file.name,
            folder: 'Video Utama',
            file,
            size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
          });
        }
      } else if (nameLower.match(/\.(srt|vtt)$/)) {
        newSubs[file.name] = file;
      }
    });

    setVideoCache(newVideos);
    setSubtitleCache(newSubs);
    setVideoList(newItems);
    closeModal();
    alert(`Berhasil memuat ${filesArray.length} file video & subtitle!`);
    e.target.value = '';
  };

  const handlePlay = async (item: VideoItem) => {
    const file = videoCache[item.name] || item.file;
    if (!file) {
      alert('File video tidak ditemukan di memori.');
      return;
    }

    // Try finding matching subtitle
    const baseName = item.name.substring(0, item.name.lastIndexOf('.')).toLowerCase();
    const subKeys = Object.keys(subtitleCache);
    const matchedKey = subKeys.find((k) => k.toLowerCase().includes(baseName));

    let subText: string | null = null;
    let subName: string | undefined = undefined;

    if (matchedKey) {
      try {
        const subFile = subtitleCache[matchedKey];
        subText = await subFile.text();
        subName = matchedKey;
      } catch (err) {
        console.error('Gagal membaca subtitle:', err);
      }
    }

    onPlayVideo(item.name, file, subText, subName);
  };

  const filteredVideos = videoList.filter((v) => {
    const matchFolder = selectedFolder === 'ALL' || v.folder === selectedFolder;
    const q = deferredSearch.trim().toLowerCase();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.folder.toLowerCase().includes(q);
    return matchFolder && matchSearch;
  });

  return (
    <div className="space-y-4 pb-24">

      {/* Upload & Directory Pop Up Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#161925] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1C202F]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#3DDC84] rounded-lg flex items-center justify-center text-[#0F111A]">
                  <Film size={14} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                    BUKA / UNGGAH VIDEO
                  </h3>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    Mendukung MP4, MKV, WebM & Subtitle SRT, VTT
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer"
                title="Tutup pop up"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                Pilih folder dari penyimpanan perangkat USB, atau pilih file video beserta file subtitlenya.
              </p>

              <div className="space-y-2.5">
                <button
                  id="btn-pick-usb-dir"
                  type="button"
                  onClick={async () => {
                    await handleDirectoryPicker();
                  }}
                  disabled={isScanning}
                  className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-[#12141F] border border-slate-200 dark:border-slate-700 hover:border-[#3DDC84]/50 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <FolderSearch size={16} className="text-[#3DDC84]" />
                  <span>{isScanning ? 'MEMINDAI FOLDER...' : 'PILIH DIREKTORI USB / PERANGKAT'}</span>
                </button>

                <label className="w-full py-3 px-4 rounded-xl bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-xs font-mono font-bold uppercase tracking-tight shadow-xs flex items-center justify-center gap-2.5 cursor-pointer transition-all">
                  <Upload size={16} className="stroke-[2.5]" />
                  <span>UPLOAD FILE VIDEO & SUBTITLE</span>
                  <input
                    type="file"
                    accept="video/*,.srt,.vtt,.mp4,.mkv,.webm"
                    multiple
                    onChange={(e) => {
                      handleFileUpload(e);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1C202F]">
              <button
                type="button"
                onClick={closeModal}
                className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Row */}
      {videoList.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 px-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] shrink-0">
              FILTER:
            </span>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161925] text-slate-800 dark:text-slate-200 text-xs font-mono focus:border-[#3DDC84] focus:outline-hidden shadow-2xs"
            >
              <option value="ALL">Semua Folder</option>
              {Array.from(new Set(videoList.map((v) => v.folder))).map((folder) => (
                <option key={folder} value={folder}>
                  📁 {folder}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            TOTAL: <span className="font-bold text-[#3DDC84]">{videoList.length}</span> VIDEO
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            DAFTAR VIDEO [{filteredVideos.length}]
          </h4>
          {Object.keys(subtitleCache).length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-[#3DDC84] font-bold">
              <Subtitles size={12} /> {Object.keys(subtitleCache).length} SUBTITLE TERHUBUNG
            </span>
          )}
        </div>

        {filteredVideos.length === 0 ? (
          <div className="bg-white dark:bg-[#161925] p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Film size={32} className="mx-auto text-slate-400" />
            <h4 className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
              BELUM ADA FILE VIDEO YANG DIMUAT
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Klik tombol di bawah untuk memilih direktori USB atau mengunggah video.
            </p>
            <button
              type="button"
              onClick={() => setInternalUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-xs font-mono font-bold tracking-tight shadow-xs transition-all mt-2 cursor-pointer"
            >
              <Upload size={14} className="stroke-[2.5]" />
              <span>+ BUKA / UPLOAD VIDEO PERTAMA</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredVideos.map((video) => {
              const resumeKey = 'resume_vid_' + video.name;
              const savedResume = localStorage.getItem(resumeKey);
              const resumeTime = savedResume ? Math.floor(parseFloat(savedResume)) : 0;

              return (
                <div
                  key={video.name}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#161925] border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-xs hover:border-[#3DDC84]/50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-[#3DDC84] flex items-center justify-center shrink-0">
                      <Film size={16} />
                    </div>
                    <div className="overflow-hidden min-w-0 flex-1">
                      <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 line-clamp-2" title={video.name}>
                        {video.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {video.folder} {video.size && `• ${video.size}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {resumeTime > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-[#3DDC84] font-bold">
                        <Clock size={11} /> LANJUT {Math.floor(resumeTime / 60)}M {resumeTime % 60}S
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">BELUM DITONTON</span>
                    )}

                    <button
                      onClick={() => handlePlay(video)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-xs font-mono font-bold shadow-xs transition-colors"
                    >
                      <Play size={11} fill="currentColor" />
                      <span>PUTAR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
