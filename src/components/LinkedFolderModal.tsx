import React from 'react';
import { X, Folder, FileText, Archive, ExternalLink, AlertCircle, FolderGit2 } from 'lucide-react';
import { MangaFileRecord } from '../types';
import { parseFolder } from '../utils/mangaParser';

interface LinkedFolderModalProps {
  folderName: string | null;
  files: MangaFileRecord[];
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (file: MangaFileRecord) => void;
}

export const LinkedFolderModal: React.FC<LinkedFolderModalProps> = ({
  folderName,
  files,
  isOpen,
  onClose,
  onOpenFile
}) => {
  if (!isOpen || !folderName) return null;

  const folderFiles = files.filter((f) => {
    const parsed = parseFolder(f.folder);
    return (
      (f.folder || 'Tanpa Folder') === folderName ||
      parsed.mainFolder === folderName ||
      Boolean(f.folder && (f.folder.startsWith(folderName + '/') || f.folder.startsWith(folderName + ' /')))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#161925] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1C202F]">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="w-5 h-5 bg-[#3DDC84] rounded flex items-center justify-center">
              <Folder size={12} className="text-[#0F111A]" />
            </div>
            <h3 className="font-mono font-bold text-xs tracking-tight text-slate-900 dark:text-white uppercase">
              FOLDER: <span className="text-[#3DDC84]">{folderName}</span>
            </h3>
          </div>
          <button
            id="btn-close-linked-modal"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-2.5">
          {folderFiles.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-[#12141F] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <AlertCircle size={28} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                BELUM ADA FILE DI FOLDER "{folderName}"
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                Buka tab <span className="font-mono font-bold text-[#3DDC84]">Manga CBZ</span> untuk mengunggah bab/volume manga ke folder ini.
              </p>
            </div>
          ) : (
            folderFiles.map((file) => {
              const isArchive = file.fileName.toLowerCase().match(/\.(zip|cbz)$/);
              const parsed = parseFolder(file.folder);

              return (
                <div
                  key={file.id || file.fileName}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141F] flex flex-col justify-between gap-2.5 hover:border-[#3DDC84]/50 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-[#3DDC84] flex items-center justify-center shrink-0">
                      {isArchive ? <Archive size={15} /> : <FileText size={15} />}
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

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 overflow-hidden truncate">
                      <span>{file.fileSize}</span>
                      <span>•</span>
                      <span>{file.uploadedAt}</span>
                      {parsed.subFolder && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[#3DDC84] font-bold truncate">
                            <FolderGit2 size={10} />
                            {parsed.subFolder}
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      id={`btn-open-linked-file-${file.id}`}
                      onClick={() => {
                        onClose();
                        onOpenFile(file);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] text-xs font-mono font-bold shrink-0 ml-auto shadow-xs transition-colors cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      BUKA
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
