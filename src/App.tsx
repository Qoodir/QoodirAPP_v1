import React, { useState, useEffect } from 'react';
import {
  ComicItem,
  OwnedVolumesMap,
  MangaFileRecord,
  MusicTrackRecord
} from './types';
import {
  getComicsFromDb,
  saveComicsToDb,
  getOwnedVolumesFromDb,
  saveOwnedVolumesToDb,
  getAllMangaFiles,
  addMangaFile,
  deleteMangaFile,
  updateMangaStatus,
  updateMangaFolder,
  getAllMusicTracks,
  addMusicTrack,
  deleteMusicTrack
} from './db/indexedDb';
import { formatFileSize, parseFolder } from './utils/mangaParser';
import { Trash2 } from 'lucide-react';

import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { ComicCatalog } from './components/ComicCatalog';
import { ComicDetailModal } from './components/ComicDetailModal';
import { AddComicModal } from './components/AddComicModal';
import { LinkedFolderModal } from './components/LinkedFolderModal';
import { MangaReader } from './components/MangaReader';
import { MangaViewerModal } from './components/MangaViewerModal';
import { MusicPlayer } from './components/MusicPlayer';
import { FloatingMusicPlayer } from './components/FloatingMusicPlayer';
import { VideoPlayer } from './components/VideoPlayer';
import { ActiveVideoModal } from './components/ActiveVideoModal';
import { Notepad } from './components/Notepad';
import { StatsModal } from './components/StatsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'manga' | 'music' | 'video' | 'notepad'>('catalog');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Comics & Volumes
  const [comics, setComics] = useState<ComicItem[]>([]);
  const [ownedVolumes, setOwnedVolumes] = useState<OwnedVolumesMap>({});
  const [selectedComicForDetail, setSelectedComicForDetail] = useState<ComicItem | null>(null);
  const [isAddComicOpen, setIsAddComicOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [linkedFolderToOpen, setLinkedFolderToOpen] = useState<string | null>(null);
  const [comicToDelete, setComicToDelete] = useState<ComicItem | null>(null);

  // Manga Files
  const [mangaFiles, setMangaFiles] = useState<MangaFileRecord[]>([]);
  const [mangaViewerState, setMangaViewerState] = useState<{
    isOpen: boolean;
    title: string;
    blob: Blob | null;
  }>({
    isOpen: false,
    title: '',
    blob: null
  });

  // Music Tracks & Player
  const [musicTracks, setMusicTracks] = useState<MusicTrackRecord[]>([]);
  const [musicQueue, setMusicQueue] = useState<MusicTrackRecord[]>([]);
  const [musicQueueIndex, setMusicQueueIndex] = useState(0);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);

  // Video Player
  const [activeVideoState, setActiveVideoState] = useState<{
    isOpen: boolean;
    name: string;
    blob: Blob | null;
    subText: string | null;
    subName?: string;
  }>({
    isOpen: false,
    name: '',
    blob: null,
    subText: null
  });

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Load initial database data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedComics, loadedOwned, loadedManga, loadedMusic] = await Promise.all([
          getComicsFromDb(),
          getOwnedVolumesFromDb(),
          getAllMangaFiles(),
          getAllMusicTracks()
        ]);

        setComics(loadedComics);
        setOwnedVolumes(loadedOwned);
        setMangaFiles(loadedManga);
        setMusicTracks(loadedMusic);
      } catch (err) {
        console.error('Error initializing database:', err);
      }
    };
    loadData();
  }, []);

  // Comic Actions
  const handleAddComic = async (newComicData: Omit<ComicItem, 'id'>) => {
    const newComic: ComicItem = {
      ...newComicData,
      id: Date.now()
    };
    const updated = [newComic, ...comics];
    setComics(updated);
    await saveComicsToDb(updated);
  };

  const handleDeleteComic = (id: number) => {
    const found = comics.find((c) => c.id === id);
    if (found) {
      setComicToDelete(found);
    }
  };

  const confirmDeleteComic = async () => {
    if (!comicToDelete) return;
    const id = comicToDelete.id;
    const updated = comics.filter((c) => c.id !== id);
    setComics(updated);
    await saveComicsToDb(updated);

    const updatedOwned = { ...ownedVolumes };
    delete updatedOwned[id];
    setOwnedVolumes(updatedOwned);
    await saveOwnedVolumesToDb(updatedOwned);

    if (selectedComicForDetail?.id === id) {
      setSelectedComicForDetail(null);
    }
    setComicToDelete(null);
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= comics.length) return;

    const reordered = [...comics];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setComics(reordered);
    await saveComicsToDb(reordered);
  };

  const handleToggleVolume = async (comicId: number, volume: number) => {
    const current = ownedVolumes[comicId] || [];
    let updatedList: number[];

    if (current.includes(volume)) {
      updatedList = current.filter((v) => v !== volume);
    } else {
      updatedList = [...current, volume];
    }

    const updatedMap = {
      ...ownedVolumes,
      [comicId]: updatedList
    };
    setOwnedVolumes(updatedMap);
    await saveOwnedVolumesToDb(updatedMap);
  };

  const handleSelectAllVolumes = async (comicId: number, total: number) => {
    const all = Array.from({ length: total }, (_, i) => i + 1);
    const updatedMap = {
      ...ownedVolumes,
      [comicId]: all
    };
    setOwnedVolumes(updatedMap);
    await saveOwnedVolumesToDb(updatedMap);
  };

  const handleClearAllVolumes = async (comicId: number) => {
    const updatedMap = {
      ...ownedVolumes,
      [comicId]: []
    };
    setOwnedVolumes(updatedMap);
    await saveOwnedVolumesToDb(updatedMap);
  };

  const handleUpdateTotalVolumes = async (comicId: number, total: number) => {
    const updated = comics.map((c) => (c.id === comicId ? { ...c, totalVolumes: total } : c));
    setComics(updated);
    await saveComicsToDb(updated);

    if (selectedComicForDetail?.id === comicId) {
      setSelectedComicForDetail((prev) => (prev ? { ...prev, totalVolumes: total } : null));
    }
  };

  const handleUpdateFolderLink = async (comicId: number, folder: string) => {
    const updated = comics.map((c) => (c.id === comicId ? { ...c, mangaLinkFolder: folder } : c));
    setComics(updated);
    await saveComicsToDb(updated);

    if (selectedComicForDetail?.id === comicId) {
      setSelectedComicForDetail((prev) => (prev ? { ...prev, mangaLinkFolder: folder } : null));
    }
  };

  // Manga Actions
  const handleAddMangaFiles = async (files: (File & { customFolder?: string })[], defaultFolder: string) => {
    for (const file of files) {
      let finalFolder = file.customFolder || defaultFolder;
      // Auto-extract folder/sub-folder if directory uploaded
      if (!file.customFolder && file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 2) {
          finalFolder = parts.slice(0, -1).join('/');
        } else if (parts.length === 2) {
          finalFolder = parts[0];
        }
      }

      const record: Omit<MangaFileRecord, 'id'> = {
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileData: file,
        folder: finalFolder,
        uploadedAt: new Date().toLocaleDateString('id-ID'),
        status: 'Belum Dibaca'
      };
      await addMangaFile(record);
    }
    const updated = await getAllMangaFiles();
    setMangaFiles(updated);
  };

  const handleDeleteMangaFile = async (id: number) => {
    await deleteMangaFile(id);
    const updated = await getAllMangaFiles();
    setMangaFiles(updated);
  };

  const handleUpdateMangaStatus = async (
    id: number,
    status: 'Belum Dibaca' | 'Sedang Dibaca' | 'Selesai'
  ) => {
    await updateMangaStatus(id, status);
    const updated = await getAllMangaFiles();
    setMangaFiles(updated);
  };

  const handleUpdateMangaFolder = async (id: number, newFolder: string) => {
    await updateMangaFolder(id, newFolder);
    const updated = await getAllMangaFiles();
    setMangaFiles(updated);
  };

  const handleReadManga = (title: string, blob: Blob) => {
    setMangaViewerState({
      isOpen: true,
      title,
      blob
    });
  };

  // Music Actions
  const handleAddMusicTracks = async (files: File[], folder: string) => {
    for (const file of files) {
      const record: Omit<MusicTrackRecord, 'id'> = {
        title: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        fileData: file,
        folder,
        uploadedAt: new Date().toLocaleDateString('id-ID')
      };
      await addMusicTrack(record);
    }
    const updated = await getAllMusicTracks();
    setMusicTracks(updated);
  };

  const handleDeleteMusicTrack = async (id: number) => {
    await deleteMusicTrack(id);
    const updated = await getAllMusicTracks();
    setMusicTracks(updated);
    setMusicQueue((prev) => prev.filter((t) => t.id !== id));
  };

  const handlePlayMusicQueue = (queue: MusicTrackRecord[], startIndex = 0) => {
    setMusicQueue(queue);
    setMusicQueueIndex(startIndex);
    setIsMusicPlayerOpen(true);
  };

  const handleNextMusicTrack = () => {
    if (musicQueue.length === 0) return;
    setMusicQueueIndex((prev) => (prev + 1 >= musicQueue.length ? 0 : prev + 1));
  };

  const handlePrevMusicTrack = () => {
    if (musicQueue.length === 0) return;
    setMusicQueueIndex((prev) => (prev - 1 < 0 ? musicQueue.length - 1 : prev - 1));
  };

  // Video Actions
  const handlePlayVideo = (
    name: string,
    blob: Blob,
    subText: string | null,
    subName?: string
  ) => {
    setActiveVideoState({
      isOpen: true,
      name,
      blob,
      subText,
      subName
    });
  };

  // Unique folders for linking (include both main folders and full paths)
  const availableMangaFolders = Array.from(
    new Set(
      mangaFiles
        .flatMap((f) => {
          const parsed = parseFolder(f.folder);
          const list: string[] = [];
          if (parsed.mainFolder && parsed.mainFolder !== 'Tanpa Folder') {
            list.push(parsed.mainFolder);
          }
          if (f.folder && f.folder !== 'Tanpa Folder') {
            list.push(f.folder);
          }
          return list;
        })
    )
  ).sort();

  // Calculated Stats for Logo Modal
  const totalComics = comics.length;
  const totalVolumesTotal = comics.reduce((acc, c) => acc + c.totalVolumes, 0);
  const totalVolumesOwned = comics.reduce((acc, c) => {
    const owned = ownedVolumes[c.id] || [];
    return acc + owned.filter((v) => v <= c.totalVolumes).length;
  }, 0);
  const percentOwned = totalVolumesTotal > 0
    ? Math.min(100, Math.round((totalVolumesOwned / totalVolumesTotal) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0F111A] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 font-sans">
      {/* Top App Bar */}
      <TopAppBar
        activeTab={activeTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onOpenAddComic={() => setIsAddComicOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4">
        <div key={activeTab} className="tab-transition">
          {activeTab === 'catalog' && (
            <ComicCatalog
              comics={comics}
              ownedVolumes={ownedVolumes}
              onSelectComic={(c) => setSelectedComicForDetail(c)}
              onDeleteComic={handleDeleteComic}
              onMoveOrder={handleMoveOrder}
              onOpenLinkedFolder={(folder) => setLinkedFolderToOpen(folder)}
              onOpenAddModal={() => setIsAddComicOpen(true)}
            />
          )}

          {activeTab === 'manga' && (
            <MangaReader
              mangaFiles={mangaFiles}
              onAddFiles={handleAddMangaFiles}
              onDeleteFile={handleDeleteMangaFile}
              onUpdateStatus={handleUpdateMangaStatus}
              onUpdateFolder={handleUpdateMangaFolder}
              onReadManga={handleReadManga}
            />
          )}

          {activeTab === 'music' && (
            <MusicPlayer
              tracks={musicTracks}
              onAddTracks={handleAddMusicTracks}
              onDeleteTrack={handleDeleteMusicTrack}
              onPlayQueue={handlePlayMusicQueue}
            />
          )}

          {activeTab === 'video' && (
            <VideoPlayer onPlayVideo={handlePlayVideo} />
          )}

          {activeTab === 'notepad' && (
            <Notepad />
          )}
        </div>
      </main>

      {/* Floating Bottom Music Player */}
      <FloatingMusicPlayer
        queue={musicQueue}
        currentIndex={musicQueueIndex}
        isOpen={isMusicPlayerOpen}
        onClose={() => setIsMusicPlayerOpen(false)}
        onNext={handleNextMusicTrack}
        onPrev={handlePrevMusicTrack}
      />

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Modals */}
      <AddComicModal
        isOpen={isAddComicOpen}
        onClose={() => setIsAddComicOpen(false)}
        onAddComic={handleAddComic}
        availableFolders={availableMangaFolders}
      />

      <ComicDetailModal
        comic={selectedComicForDetail}
        ownedVolumes={selectedComicForDetail ? ownedVolumes[selectedComicForDetail.id] || [] : []}
        availableFolders={availableMangaFolders}
        isOpen={!!selectedComicForDetail}
        onClose={() => setSelectedComicForDetail(null)}
        onToggleVolume={handleToggleVolume}
        onSelectAllVolumes={handleSelectAllVolumes}
        onClearAllVolumes={handleClearAllVolumes}
        onUpdateTotalVolumes={handleUpdateTotalVolumes}
        onUpdateFolderLink={handleUpdateFolderLink}
      />

      <LinkedFolderModal
        folderName={linkedFolderToOpen}
        files={mangaFiles}
        isOpen={!!linkedFolderToOpen}
        onClose={() => setLinkedFolderToOpen(null)}
        onOpenFile={(file) => handleReadManga(file.fileName, file.fileData)}
      />

      <MangaViewerModal
        isOpen={mangaViewerState.isOpen}
        title={mangaViewerState.title}
        fileBlob={mangaViewerState.blob}
        onClose={() => setMangaViewerState({ isOpen: false, title: '', blob: null })}
      />

      <ActiveVideoModal
        isOpen={activeVideoState.isOpen}
        videoName={activeVideoState.name}
        videoBlob={activeVideoState.blob}
        subtitleText={activeVideoState.subText}
        subtitleName={activeVideoState.subName}
        onClose={() => setActiveVideoState({ isOpen: false, name: '', blob: null, subText: null })}
      />

      {/* Stats and Database Info Modal from Logo */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        totalComics={totalComics}
        totalVolumesOwned={totalVolumesOwned}
        totalVolumesTotal={totalVolumesTotal}
        percentOwned={percentOwned}
      />

      {/* Modal Konfirmasi Hapus Komik dari Katalog */}
      {comicToDelete && (
        <div
          id="modal-confirm-delete-comic"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setComicToDelete(null)}
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
                  HAPUS KOMIK DARI KATALOG?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Komik ini beserta riwayat volume kepemilikan akan dihapus dari katalog lokal.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-left">
                <p
                  className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate whitespace-nowrap block"
                  title={comicToDelete.title}
                >
                  📚 {comicToDelete.title}
                </p>
                <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                  Oleh: {comicToDelete.author} • {comicToDelete.totalVolumes} Volume
                </p>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  id="btn-cancel-delete-comic"
                  onClick={() => setComicToDelete(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#12141F] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-comic"
                  onClick={confirmDeleteComic}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>HAPUS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
