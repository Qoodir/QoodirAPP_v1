import React, { useState, useMemo } from 'react';
import {
  Upload,
  FolderPlus,
  BookOpen,
  Folder,
  FolderTree,
  FolderGit2,
  FolderOpen,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileArchive,
  FileText,
  Play,
  ArrowRightLeft,
  X,
  Check,
  FolderUp
} from 'lucide-react';
import { MangaFileRecord } from '../types';
import {
  formatFileSize,
  triggerDownload,
  parseFolder,
  ParsedFolder
} from '../utils/mangaParser';

export interface FolderGroupStructure {
  mainFolderName: string;
  directFiles: MangaFileRecord[];
  subFolders: Record<string, MangaFileRecord[]>;
  totalCount: number;
}

interface MangaReaderProps {
  mangaFiles: MangaFileRecord[];
  onAddFiles: (files: (File & { customFolder?: string })[], folder: string) => Promise<void>;
  onDeleteFile: (id: number) => Promise<void>;
  onUpdateStatus: (id: number, status: 'Belum Dibaca' | 'Sedang Dibaca' | 'Selesai') => Promise<void>;
  onUpdateFolder?: (id: number, folder: string) => Promise<void>;
  onReadManga: (title: string, blob: Blob) => void;
}

export const MangaReader: React.FC<MangaReaderProps> = ({
  mangaFiles,
  onAddFiles,
  onDeleteFile,
  onUpdateStatus,
  onUpdateFolder,
  onReadManga
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<'files' | 'directory'>('files');
  const [targetMainFolder, setTargetMainFolder] = useState('Tanpa Folder');
  const [newMainFolderName, setNewMainFolderName] = useState('');
  const [targetSubFolder, setTargetSubFolder] = useState('__NONE__');
  const [newSubFolderName, setNewSubFolderName] = useState('');

  const [filterFolder, setFilterFolder] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedMainFolders, setExpandedMainFolders] = useState<Record<string, boolean>>({});
  const [expandedSubFolders, setExpandedSubFolders] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);

  // State for moving file to another folder/subfolder
  const [movingFile, setMovingFile] = useState<MangaFileRecord | null>(null);
  const [moveTargetMain, setMoveTargetMain] = useState('');
  const [moveNewMain, setMoveNewMain] = useState('');
  const [moveTargetSub, setMoveTargetSub] = useState('__NONE__');
  const [moveNewSub, setMoveNewSub] = useState('');

  // State for in-app delete confirmation (avoids iframe confirm() blocks)
  const [fileToDelete, setFileToDelete] = useState<MangaFileRecord | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Extract all Main Folders and their respective Sub-Folders
  const folderHierarchy = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    mangaFiles.forEach((f) => {
      const { mainFolder, subFolder } = parseFolder(f.folder);
      if (!map[mainFolder]) {
        map[mainFolder] = new Set<string>();
      }
      if (subFolder) {
        map[mainFolder].add(subFolder);
      }
    });
    return map;
  }, [mangaFiles]);

  const existingMainFolders = useMemo(() => {
    return Object.keys(folderHierarchy).sort();
  }, [folderHierarchy]);

  // Subfolders available under selected targetMainFolder
  const subFoldersForSelectedMain = useMemo(() => {
    if (targetMainFolder === 'Tanpa Folder' || targetMainFolder === '__NEW__') return [];
    return Array.from(folderHierarchy[targetMainFolder] || []).sort();
  }, [folderHierarchy, targetMainFolder]);

  // Subfolders available for moving file modal
  const subFoldersForMoveMain = useMemo(() => {
    if (!moveTargetMain || moveTargetMain === 'Tanpa Folder' || moveTargetMain === '__NEW__') return [];
    return Array.from(folderHierarchy[moveTargetMain] || []).sort();
  }, [folderHierarchy, moveTargetMain]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSaveToStorage = async () => {
    if (selectedFiles.length === 0) {
      alert('Pilih file manga (.pdf, .zip, .cbz) terlebih dahulu!');
      return;
    }

    let finalMain = targetMainFolder;
    if (targetMainFolder === '__NEW__') {
      if (!newMainFolderName.trim()) {
        alert('Tuliskan nama Folder Utama baru!');
        return;
      }
      finalMain = newMainFolderName.trim();
    }

    let finalFolder = finalMain;
    if (finalMain !== 'Tanpa Folder') {
      let finalSub = targetSubFolder;
      if (targetSubFolder === '__NEW__') {
        if (!newSubFolderName.trim()) {
          alert('Tuliskan nama Sub-Folder baru!');
          return;
        }
        finalSub = newSubFolderName.trim();
      }

      if (finalSub && finalSub !== '__NONE__') {
        finalFolder = `${finalMain}/${finalSub}`;
      }
    }

    setIsUploading(true);
    try {
      await onAddFiles(selectedFiles, finalFolder);
      setSelectedFiles([]);
      setNewMainFolderName('');
      setNewSubFolderName('');
      setTargetSubFolder('__NONE__');
      if (finalMain !== 'Tanpa Folder') {
        setTargetMainFolder(finalMain);
      }
      // Auto expand the folder
      setExpandedMainFolders((prev) => ({ ...prev, [finalMain]: true }));
      alert(`Sukses menyimpan ${selectedFiles.length} file manga ke ${finalFolder}!`);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan file ke database.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReadTemporary = () => {
    if (selectedFiles.length === 0) {
      alert('Pilih file manga terlebih dahulu!');
      return;
    }
    const file = selectedFiles[0];
    onReadManga(file.name + ' (Sementara)', file);
  };

  const toggleMainFolder = (mainName: string) => {
    setExpandedMainFolders((prev) => ({ ...prev, [mainName]: !prev[mainName] }));
  };

  const toggleSubFolder = (subKey: string) => {
    setExpandedSubFolders((prev) => ({ ...prev, [subKey]: !prev[subKey] }));
  };

  // Baca Gabung for any collection of files
  const handleReadFilesCombined = (title: string, filesList: MangaFileRecord[]) => {
    const archiveFiles = filesList.filter((f) =>
      f.fileName.toLowerCase().match(/\.(zip|cbz)$/)
    );

    if (archiveFiles.length === 0) {
      // If PDF only or mixed
      if (filesList.length > 0) {
        onReadManga(filesList[0].fileName, filesList[0].fileData);
      } else {
        alert('Tidak ada file komik untuk dibaca.');
      }
      return;
    }

    // Sort by name
    archiveFiles.sort((a, b) =>
      a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: 'base' })
    );

    onReadManga(title, archiveFiles[0].fileData);
  };

  // Group files into Main Folders -> (Direct Files + Sub-Folders)
  const groupedData = useMemo<Record<string, FolderGroupStructure>>(() => {
    const filtered = mangaFiles.filter((file) => {
      const parsed = parseFolder(file.folder);
      const matchFolder =
        filterFolder === 'ALL' ||
        parsed.mainFolder === filterFolder ||
        file.folder === filterFolder;
      const matchStatus = filterStatus === 'ALL' || file.status === filterStatus;
      return matchFolder && matchStatus;
    });

    const groups: Record<string, FolderGroupStructure> = {};

    filtered.forEach((file) => {
      const parsed = parseFolder(file.folder);
      const mName = parsed.mainFolder;

      if (!groups[mName]) {
        groups[mName] = {
          mainFolderName: mName,
          directFiles: [],
          subFolders: {},
          totalCount: 0
        };
      }

      groups[mName].totalCount += 1;

      if (!parsed.subFolder) {
        groups[mName].directFiles.push(file);
      } else {
        const sName = parsed.subFolder;
        if (!groups[mName].subFolders[sName]) {
          groups[mName].subFolders[sName] = [];
        }
        groups[mName].subFolders[sName].push(file);
      }
    });

    // Sort files alphabetically within each group
    Object.values(groups).forEach((g) => {
      g.directFiles.sort((a, b) =>
        a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: 'base' })
      );
      Object.values(g.subFolders).forEach((subList) => {
        subList.sort((a, b) =>
          a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: 'base' })
        );
      });
    });

    return groups;
  }, [mangaFiles, filterFolder, filterStatus]);

  // Open move modal
  const openMoveModal = (file: MangaFileRecord) => {
    const parsed = parseFolder(file.folder);
    setMovingFile(file);
    setMoveTargetMain(parsed.mainFolder);
    setMoveNewMain('');
    setMoveTargetSub(parsed.subFolder || '__NONE__');
    setMoveNewSub('');
  };

  const handleSaveMove = async () => {
    if (!movingFile || !movingFile.id || !onUpdateFolder) return;

    let finalMain = moveTargetMain;
    if (moveTargetMain === '__NEW__') {
      if (!moveNewMain.trim()) {
        alert('Tuliskan nama folder utama baru!');
        return;
      }
      finalMain = moveNewMain.trim();
    }

    let finalFolder = finalMain;
    if (finalMain !== 'Tanpa Folder') {
      let finalSub = moveTargetSub;
      if (moveTargetSub === '__NEW__') {
        if (!moveNewSub.trim()) {
          alert('Tuliskan nama sub-folder baru!');
          return;
        }
        finalSub = moveNewSub.trim();
      }

      if (finalSub && finalSub !== '__NONE__') {
        finalFolder = `${finalMain}/${finalSub}`;
      }
    }

    try {
      await onUpdateFolder(movingFile.id, finalFolder);
      setMovingFile(null);
    } catch (err) {
      console.error(err);
      alert('Gagal memindahkan file.');
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Upload Box Card */}
      <div className="bg-white dark:bg-[#161925] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-slate-900 dark:text-white">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#3DDC84] rounded flex items-center justify-center text-[#0F111A]">
              <Upload size={13} className="stroke-[2.5]" />
            </div>
            <h3 className="text-xs font-mono font-bold tracking-tight uppercase">
              UPLOAD MANGA OFFLINE (PDF, ZIP, CBZ)
            </h3>
          </div>

          {/* Mode Switcher: Berkas vs Folder */}
          <div className="flex items-center bg-slate-100 dark:bg-[#0F111A] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setUploadMode('files');
                setSelectedFiles([]);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                uploadMode === 'files'
                  ? 'bg-white dark:bg-[#1C202F] text-[#3DDC84] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📄 PILIH BERKAS
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode('directory');
                setSelectedFiles([]);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                uploadMode === 'directory'
                  ? 'bg-white dark:bg-[#1C202F] text-[#3DDC84] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📁 UNGGAH FOLDER
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
          {uploadMode === 'directory'
            ? 'Pilih satu folder dari perangkat. Sistem akan otomatis memasukkan sub-folder ke dalam Folder Utama manga terkait.'
            : 'Pilih file komik, lalu tentukan Folder Utama dan Sub-Folder (opsional) agar koleksi tertata bersih.'}
        </p>

        <div className="space-y-3 pt-1">
          {/* File or Folder Input */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
              {uploadMode === 'directory' ? '1. PILIH FOLDER MANGA DARI PERANGKAT:' : '1. PILIH FILE MANGA:'}
            </label>

            {uploadMode === 'directory' ? (
              <input
                id="input-manga-directory"
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFileChange}
                className="w-full text-xs font-mono text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-mono file:font-bold file:bg-[#3DDC84]/20 file:text-emerald-800 dark:file:text-[#3DDC84] hover:file:bg-[#3DDC84]/30 cursor-pointer"
              />
            ) : (
              <input
                id="input-manga-file"
                type="file"
                accept=".pdf,.zip,.cbz,application/pdf,application/zip"
                multiple
                onChange={handleFileChange}
                className="w-full text-xs font-mono text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-mono file:font-bold file:bg-[#3DDC84]/20 file:text-emerald-800 dark:file:text-[#3DDC84] hover:file:bg-[#3DDC84]/30 cursor-pointer"
              />
            )}

            {selectedFiles.length > 0 && (
              <p className="text-[11px] font-mono text-emerald-600 dark:text-[#3DDC84] font-bold mt-1">
                ✓ {selectedFiles.length} FILE TERPILIH
              </p>
            )}
          </div>

          {/* Folder and Subfolder selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Main Folder Selection */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Folder size={12} className="text-[#3DDC84]" />
                2. FOLDER UTAMA:
              </label>
              <select
                id="select-manga-target-folder"
                value={targetMainFolder}
                onChange={(e) => {
                  setTargetMainFolder(e.target.value);
                  setTargetSubFolder('__NONE__');
                  setNewSubFolderName('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden"
              >
                <option value="Tanpa Folder">📄 Tanpa Folder</option>
                {existingMainFolders
                  .filter((f) => f !== 'Tanpa Folder')
                  .map((f) => (
                    <option key={f} value={f}>
                      📁 {f}
                    </option>
                  ))}
                <option value="__NEW__">➕ Buat Folder Utama Baru...</option>
              </select>

              {targetMainFolder === '__NEW__' && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Nama Folder Utama (cth: One Piece)..."
                    value={newMainFolderName}
                    onChange={(e) => setNewMainFolderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Sub-Folder Selection (Only if Main Folder !== Tanpa Folder) */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <FolderGit2 size={12} className="text-[#3DDC84]" />
                3. SUB-FOLDER (OPSIONAL):
              </label>
              <select
                id="select-manga-sub-folder"
                disabled={targetMainFolder === 'Tanpa Folder'}
                value={targetSubFolder}
                onChange={(e) => setTargetSubFolder(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden disabled:opacity-40"
              >
                <option value="__NONE__">— (Tanpa Sub-Folder / Langsung di Folder Utama) —</option>
                {subFoldersForSelectedMain.map((sf) => (
                  <option key={sf} value={sf}>
                    📂 {sf}
                  </option>
                ))}
                <option value="__NEW__">➕ Buat Sub-Folder Baru...</option>
              </select>

              {targetSubFolder === '__NEW__' && targetMainFolder !== 'Tanpa Folder' && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Nama Sub-Folder (cth: Vol 01, Arc Wano)..."
                    value={newSubFolderName}
                    onChange={(e) => setNewSubFolderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              id="btn-read-manga-temp"
              type="button"
              onClick={handleReadTemporary}
              disabled={selectedFiles.length === 0}
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] hover:border-[#3DDC84]/50 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <BookOpen size={13} className="text-[#3DDC84]" />
              <span>BACA SEMENTARA</span>
            </button>

            <button
              id="btn-save-manga-db"
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

      {/* Filter Row */}
      <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-[#161925] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] shrink-0">
          FILTER:
        </span>
        <select
          id="filter-manga-folder"
          value={filterFolder}
          onChange={(e) => setFilterFolder(e.target.value)}
          className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:outline-hidden"
        >
          <option value="ALL">📁 Semua Folder Utama</option>
          {existingMainFolders.map((f) => (
            <option key={f} value={f}>
              📁 {f}
            </option>
          ))}
        </select>

        <select
          id="filter-manga-status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex-1 min-w-[120px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:outline-hidden"
        >
          <option value="ALL">Semua Status</option>
          <option value="Belum Dibaca">Belum Dibaca</option>
          <option value="Sedang Dibaca">Sedang Dibaca</option>
          <option value="Selesai">Selesai</option>
        </select>
      </div>

      {/* Manga Files List Organized Cleanly by Main Folder -> Sub-Folders */}
      {Object.keys(groupedData).length === 0 ? (
        <div className="bg-white dark:bg-[#161925] p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <BookOpen size={32} className="mx-auto text-slate-400" />
          <h4 className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
            BELUM ADA FILE MANGA TERSIMPAN
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Upload file .cbz, .zip, atau .pdf di atas untuk membaca offline kapan saja.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(Object.entries(groupedData) as [string, FolderGroupStructure][]).map(([mainFolderName, group]) => {
            const isMainExpanded = expandedMainFolders[mainFolderName] !== false; // default open
            const subFolderEntries = Object.entries(group.subFolders) as [string, MangaFileRecord[]][];
            const subFolderCount = subFolderEntries.length;

            // Collect all files in this main folder (including subfolders) for Baca Gabung
            const allFilesInMain = [
              ...group.directFiles,
              ...subFolderEntries.flatMap(([, sFiles]) => sFiles)
            ];

            return (
              <div
                key={mainFolderName}
                className="bg-white dark:bg-[#161925] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                {/* Main Folder Accordion Header */}
                <div
                  onClick={() => toggleMainFolder(mainFolderName)}
                  className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1C202F] transition-colors border-b border-slate-100 dark:border-slate-800/80 select-none"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-[#3DDC84]/15 border border-[#3DDC84]/30 flex items-center justify-center shrink-0 text-[#3DDC84]">
                      <Folder size={15} />
                    </div>

                    <div className="flex items-center gap-2 overflow-hidden truncate">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate">
                        {mainFolderName}
                      </span>

                      {subFolderCount > 0 && (
                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#3DDC84]/15 text-[#3DDC84] border border-[#3DDC84]/30">
                          {subFolderCount} SUB-FOLDER
                        </span>
                      )}

                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                        {group.totalCount} FILE
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {allFilesInMain.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReadFilesCombined(`Folder: ${mainFolderName} (Semua)`, allFilesInMain);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-[10px] font-mono font-bold shadow-xs transition-colors"
                      >
                        <Play size={10} fill="currentColor" />
                        BACA SEMUA
                      </button>
                    )}
                    <span className="text-slate-400 p-1">
                      {isMainExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </div>

                {/* Main Folder Content (Sub-Folders and Direct Files) */}
                {isMainExpanded && (
                  <div className="p-3 sm:p-4 bg-slate-50/50 dark:bg-[#0F111A]/40 space-y-3.5">
                    {/* 1. Sub-Folders Section (Nested Cleanly Inside Main Folder) */}
                    {subFolderEntries.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-slate-400 px-1">
                          <FolderTree size={12} className="text-[#3DDC84]" />
                          SUB-FOLDER DALAM "{mainFolderName}":
                        </div>

                        <div className="space-y-2 pl-1 sm:pl-2">
                          {subFolderEntries.map(([subFolderName, subFiles]) => {
                            const subKey = `${mainFolderName}/${subFolderName}`;
                            const isSubExpanded = expandedSubFolders[subKey] !== false; // default open

                            return (
                              <div
                                key={subFolderName}
                                className="bg-white dark:bg-[#161925] rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs"
                              >
                                {/* Sub-Folder Header */}
                                <div
                                  onClick={() => toggleSubFolder(subKey)}
                                  className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <FolderGit2 size={14} className="text-[#3DDC84] shrink-0" />
                                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {subFolderName}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      [{subFiles.length} FILE]
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {subFiles.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReadFilesCombined(
                                            `${mainFolderName} - ${subFolderName}`,
                                            subFiles
                                          );
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#3DDC84] hover:text-[#0F111A] text-slate-700 dark:text-slate-300 text-[9px] font-mono font-bold transition-colors"
                                      >
                                        <Play size={9} fill="currentColor" />
                                        BACA GABUNG
                                      </button>
                                    )}
                                    <span className="text-slate-400">
                                      {isSubExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </span>
                                  </div>
                                </div>

                                {/* Files in this Sub-Folder */}
                                {isSubExpanded && (
                                  <div className="p-2 sm:p-2.5 space-y-1.5 bg-slate-50/30 dark:bg-[#12141F]/40">
                                    {subFiles.map((file) => (
                                      <MangaFileItemRow
                                        key={file.id || file.fileName}
                                        file={file}
                                        onReadManga={onReadManga}
                                        onUpdateStatus={onUpdateStatus}
                                        onRequestDelete={(f) => setFileToDelete(f)}
                                        onOpenMoveModal={openMoveModal}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. Direct Files Section (Files stored without subfolder) */}
                    {group.directFiles.length > 0 && (
                      <div className="space-y-2">
                        {subFolderEntries.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-slate-400 px-1 pt-1">
                            <FileText size={12} className="text-slate-400" />
                            BERKAS LANGSUNG ({mainFolderName}):
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {group.directFiles.map((file) => (
                            <MangaFileItemRow
                              key={file.id || file.fileName}
                              file={file}
                              onReadManga={onReadManga}
                              onUpdateStatus={onUpdateStatus}
                              onRequestDelete={(f) => setFileToDelete(f)}
                              onOpenMoveModal={openMoveModal}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Pindahkan Berkas ke Folder/Sub-Folder Lain */}
      {movingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white dark:bg-[#161925] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1C202F]">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={14} className="text-[#3DDC84]" />
                <h4 className="font-mono font-bold text-xs uppercase text-slate-900 dark:text-white">
                  PINDAHKAN FILE KE SUB-FOLDER
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setMovingFile(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                  {movingFile.fileName}
                </p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Lokasi saat ini: <span className="text-[#3DDC84]">{movingFile.folder || 'Tanpa Folder'}</span>
                </p>
              </div>

              {/* Main Folder Choice */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  FOLDER UTAMA TUJUAN:
                </label>
                <select
                  value={moveTargetMain}
                  onChange={(e) => {
                    setMoveTargetMain(e.target.value);
                    setMoveTargetSub('__NONE__');
                    setMoveNewSub('');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:outline-hidden"
                >
                  <option value="Tanpa Folder">📄 Tanpa Folder</option>
                  {existingMainFolders
                    .filter((f) => f !== 'Tanpa Folder')
                    .map((f) => (
                      <option key={f} value={f}>
                        📁 {f}
                      </option>
                    ))}
                  <option value="__NEW__">➕ Buat Folder Utama Baru...</option>
                </select>

                {moveTargetMain === '__NEW__' && (
                  <input
                    type="text"
                    placeholder="Nama Folder Utama Baru..."
                    value={moveNewMain}
                    onChange={(e) => setMoveNewMain(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:outline-hidden"
                  />
                )}
              </div>

              {/* Sub-Folder Choice */}
              {moveTargetMain !== 'Tanpa Folder' && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    SUB-FOLDER TUJUAN (OPSIONAL):
                  </label>
                  <select
                    value={moveTargetSub}
                    onChange={(e) => setMoveTargetSub(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:outline-hidden"
                  >
                    <option value="__NONE__">— (Tanpa Sub-Folder / Langsung di Folder Utama) —</option>
                    {subFoldersForMoveMain.map((sf) => (
                      <option key={sf} value={sf}>
                        📂 {sf}
                      </option>
                    ))}
                    <option value="__NEW__">➕ Buat Sub-Folder Baru...</option>
                  </select>

                  {moveTargetSub === '__NEW__' && (
                    <input
                      type="text"
                      placeholder="Nama Sub-Folder Baru (cth: Vol 01)..."
                      value={moveNewSub}
                      onChange={(e) => setMoveNewSub(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:border-[#3DDC84] focus:outline-hidden"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMovingFile(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] text-slate-700 dark:text-slate-300 text-xs font-mono font-bold"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleSaveMove}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                >
                  <Check size={13} className="stroke-[3]" />
                  <span>PINDAHKAN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus File (Aman di iFrame tanpa window.confirm) */}
      {fileToDelete && (
        <div
          id="modal-confirm-delete-manga"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeletingFile) setFileToDelete(null);
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
                  HAPUS BERKAS MANGA?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Berkas ini akan dihapus secara permanen dari penyimpanan offline database lokal browser Anda.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-left">
                <p
                  className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate whitespace-nowrap block w-full"
                  title={fileToDelete.fileName}
                >
                  📄 {fileToDelete.fileName}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1 truncate">
                  <span>📁 {fileToDelete.folder || 'Tanpa Folder'}</span>
                  <span>•</span>
                  <span>{fileToDelete.fileSize}</span>
                  {fileToDelete.uploadedAt && (
                    <>
                      <span>•</span>
                      <span>📅 {fileToDelete.uploadedAt}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  id="btn-cancel-delete-manga"
                  disabled={isDeletingFile}
                  onClick={() => setFileToDelete(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#12141F] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-manga"
                  disabled={isDeletingFile}
                  onClick={async () => {
                    if (fileToDelete && fileToDelete.id !== undefined) {
                      setIsDeletingFile(true);
                      try {
                        await onDeleteFile(fileToDelete.id);
                        setFileToDelete(null);
                      } catch (err) {
                        console.error('Gagal menghapus file:', err);
                      } finally {
                        setIsDeletingFile(false);
                      }
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  <span>{isDeletingFile ? 'MENGHAPUS...' : 'HAPUS'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MangaFileItemRowProps {
  file: MangaFileRecord;
  onReadManga: (title: string, blob: Blob) => void;
  onUpdateStatus: (id: number, status: 'Belum Dibaca' | 'Sedang Dibaca' | 'Selesai') => Promise<void>;
  onRequestDelete: (file: MangaFileRecord) => void;
  onOpenMoveModal: (file: MangaFileRecord) => void;
}

const MangaFileItemRow: React.FC<MangaFileItemRowProps> = ({
  file,
  onReadManga,
  onUpdateStatus,
  onRequestDelete,
  onOpenMoveModal
}) => {
  const isArchive = file.fileName.toLowerCase().match(/\.(zip|cbz)$/);

  return (
    <div className="p-3 rounded-xl bg-white dark:bg-[#161925] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#3DDC84]/50 transition-all flex flex-col justify-between gap-2.5">
      {/* Baris Atas: Icon + Judul (Tepat 1 Baris Penuh / Truncate) + Tombol Aksi Cepat (Pindah, Unduh, Hapus) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-[#3DDC84] flex items-center justify-center shrink-0">
            {isArchive ? <FileArchive size={15} /> : <FileText size={15} />}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p
              className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate whitespace-nowrap block w-full"
              title={file.fileName}
            >
              {file.fileName}
            </p>
          </div>
        </div>

        {/* Tombol Aksi Cepat Baris Atas: Pindah, Unduh, Hapus */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onOpenMoveModal(file)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] hover:text-[#3DDC84] dark:hover:text-[#3DDC84] text-slate-500 transition-colors cursor-pointer"
            title="Pindahkan ke Folder/Sub-Folder lain"
          >
            <ArrowRightLeft size={13} />
          </button>

          <button
            type="button"
            onClick={() => triggerDownload(file.fileData, file.fileName)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12141F] hover:text-[#3DDC84] dark:hover:text-[#3DDC84] text-slate-500 transition-colors cursor-pointer"
            title="Download ke Folder Perangkat"
          >
            <Download size={13} />
          </button>

          <button
            type="button"
            onClick={() => onRequestDelete(file)}
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
            title="Hapus File"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Baris Bawah: Metadata di Kiri, Tombol BUKA di KANAN BAWAH */}
      <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 overflow-hidden truncate">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{file.fileSize}</span>
          <span>•</span>
          <span>{file.uploadedAt}</span>
          <span>•</span>
          <span
            onClick={() => {
              const nextStatus =
                file.status === 'Belum Dibaca'
                  ? 'Sedang Dibaca'
                  : file.status === 'Sedang Dibaca'
                  ? 'Selesai'
                  : 'Belum Dibaca';
              if (file.id !== undefined) onUpdateStatus(file.id, nextStatus);
            }}
            className="cursor-pointer font-bold text-emerald-600 dark:text-[#3DDC84] hover:underline whitespace-nowrap"
            title="Klik untuk ubah status baca"
          >
            {file.status}
          </span>
        </div>

        {/* Tombol BUKA di Posisi Kanan Bawah */}
        <button
          id={`btn-read-manga-${file.id}`}
          type="button"
          onClick={() => onReadManga(file.fileName, file.fileData)}
          className="px-3.5 py-1.5 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-xs font-mono font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 ml-auto cursor-pointer active:scale-95"
        >
          <BookOpen size={12} className="stroke-[2.5]" />
          <span>BUKA</span>
        </button>
      </div>
    </div>
  );
};
