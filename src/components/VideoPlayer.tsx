import React, { useState } from 'react';
import { Film, Upload, FolderSearch, Play, Subtitles, Clock, AlertCircle } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoPlayerProps {
  onPlayVideo: (name: string, blob: Blob, subText: string | null, subName?: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ onPlayVideo }) => {
  const [videoList, setVideoList] = useState<VideoItem[]>([]);
  const [videoCache, setVideoCache] = useState<Record<string, File>>({});
  const [subtitleCache, setSubtitleCache] = useState<Record<string, File>>({});
  const [selectedFolder, setSelectedFolder] = useState('ALL');
  const [isScanning, setIsScanning] = useState(false);

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

  const filteredVideos =
    selectedFolder === 'ALL'
      ? videoList
      : videoList.filter((v) => v.folder === selectedFolder);

  return (
    <div className="space-y-4 pb-24">
      {/* Upload & Directory Scan Card */}
      <div className="bg-white dark:bg-[#161925] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <div className="w-5 h-5 bg-[#3DDC84] rounded flex items-center justify-center text-[#0F111A]">
            <Film size={13} className="stroke-[2.5]" />
          </div>
          <h3 className="text-xs font-mono font-bold tracking-tight text-slate-900 dark:text-white uppercase">
            PEMUTAR VIDEO USB / LOKAL
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
          Pilih folder direktori dari USB / internal, atau upload file video (.mp4, .mkv) beserta subtitle (.srt, .vtt) untuk ditonton langsung.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            id="btn-pick-usb-dir"
            type="button"
            onClick={handleDirectoryPicker}
            disabled={isScanning}
            className="py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-[#12141F] border border-slate-200 dark:border-slate-700 hover:border-[#3DDC84]/50 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            <FolderSearch size={14} className="text-[#3DDC84]" />
            <span>{isScanning ? 'MEMINDAI FOLDER...' : 'PILIH DIREKTORI USB'}</span>
          </button>

          <label className="py-2.5 px-3 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-xs font-mono font-bold uppercase tracking-tight shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
            <Upload size={14} className="stroke-[2.5]" />
            <span>UPLOAD VIDEO & SUBTITLE</span>
            <input
              type="file"
              accept="video/*,.srt,.vtt,.mp4,.mkv,.webm"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

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
              Gunakan tombol di atas untuk memilih direktori USB atau mengunggah video.
            </p>
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
