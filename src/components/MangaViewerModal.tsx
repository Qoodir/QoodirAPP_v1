import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Download,
  FileArchive,
  FileText,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  createArchiveSession,
  createPdfSession,
  MangaReaderSession,
  isArchiveFile,
  isPdfFile,
  triggerDownload
} from '../utils/mangaParser';

interface MangaViewerModalProps {
  isOpen: boolean;
  title: string;
  fileBlob: Blob | null;
  onClose: () => void;
}

interface MangaPageItemProps {
  index: number;
  totalPages: number;
  session: MangaReaderSession;
  onVisible?: (pageIndex: number) => void;
}

const MangaPageItem: React.FC<MangaPageItemProps> = ({
  index,
  totalPages,
  session,
  onVisible
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadPage = useCallback(async () => {
    if (imgSrc) return;
    setLoading(true);
    setError(null);
    try {
      const url = await session.getPageUrl(index);
      setImgSrc(url);
    } catch (err: any) {
      console.error(`Gagal memuat halaman ${index + 1}:`, err);
      setError(err?.message || 'Gagal memuat gambar');
    } finally {
      setLoading(false);
    }
  }, [session, index, imgSrc]);

  useEffect(() => {
    // Eagerly load the first 3 pages immediately
    if (index < 3) {
      loadPage();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadPage();
          if (onVisible) onVisible(index);
        }
      },
      {
        rootMargin: '600px 0px',
        threshold: 0.01
      }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [index, loadPage, onVisible, retryCount]);

  return (
    <div
      ref={containerRef}
      id={`manga-page-${index + 1}`}
      className="w-full relative min-h-[260px] sm:min-h-[420px] bg-[#161925] rounded-xl border border-slate-800/80 shadow-lg overflow-hidden flex flex-col items-center justify-center transition-all"
    >
      {loading && !imgSrc && (
        <div className="py-24 flex flex-col items-center justify-center space-y-2 text-slate-400 font-mono">
          <Loader2 size={24} className="animate-spin text-[#3DDC84]" />
          <p className="text-[11px] uppercase tracking-wider text-slate-400">
            Memuat Halaman {index + 1}...
          </p>
        </div>
      )}

      {error && !imgSrc && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 px-4 text-center">
          <AlertTriangle size={24} className="text-amber-400" />
          <p className="text-xs font-mono text-slate-300">
            Halaman {index + 1} belum dapat ditampilkan
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[#3DDC84] text-xs font-mono border border-slate-700 transition-colors"
          >
            Coba Muat Ulang
          </button>
        </div>
      )}

      {imgSrc && (
        <div className="w-full relative">
          <img
            src={imgSrc}
            alt={`Halaman ${index + 1}`}
            className="w-full h-auto object-contain block mx-auto select-none"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[9px] text-[#3DDC84] border border-slate-800/90 shadow-xs pointer-events-none backdrop-blur-xs">
            {index + 1} / {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export const MangaViewerModal: React.FC<MangaViewerModalProps> = ({
  isOpen,
  title,
  fileBlob,
  onClose
}) => {
  const [session, setSession] = useState<MangaReaderSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !fileBlob) {
      if (session) {
        session.destroy();
        setSession(null);
      }
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let createdSession: MangaReaderSession | null = null;

    const initReader = async () => {
      setLoading(true);
      setError(null);
      setZoomLevel(100);
      setCurrentPage(1);

      const isPdf = isPdfFile(title) || fileBlob.type === 'application/pdf';
      const isArchive =
        isArchiveFile(title) ||
        fileBlob.type === 'application/zip' ||
        fileBlob.type === 'application/x-zip-compressed' ||
        fileBlob.type === 'application/x-cbz';

      try {
        if (isPdf) {
          // Direct PDF rendering via PDF.js (no iframe click, direct instant open)
          createdSession = await createPdfSession(fileBlob);
        } else if (isArchive) {
          // Ultra-fast on-demand CBZ / ZIP extraction (no upfront freeze, no mobile crash)
          createdSession = await createArchiveSession(fileBlob);
        } else {
          // Attempt archive first, then pdf
          try {
            createdSession = await createArchiveSession(fileBlob);
          } catch {
            createdSession = await createPdfSession(fileBlob);
          }
        }

        if (!isMounted) {
          createdSession.destroy();
          return;
        }

        setSession(createdSession);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Reader init error:', err);
        setError(
          err?.message ||
            'Gagal membuka file. Pastikan format komik berupa .cbz, .zip, atau .pdf yang valid.'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initReader();

    return () => {
      isMounted = false;
      if (createdSession) {
        createdSession.destroy();
      }
    };
  }, [isOpen, fileBlob, title]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const scrollToPage = (pageNumber: number) => {
    if (!session || pageNumber < 1 || pageNumber > session.totalCount) return;
    const el = document.getElementById(`manga-page-${pageNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNumber);
    }
  };

  if (!isOpen) return null;

  const isPdf = session?.type === 'pdf';
  const totalPages = session?.totalCount || 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F111A] text-white flex flex-col animate-in fade-in duration-200">
      {/* Reader Top Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#161925] border-b border-slate-800 shrink-0 gap-2">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
          <button
            id="btn-back-manga-viewer"
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0F111A] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white transition-colors shrink-0"
          >
            <ArrowLeft size={14} className="text-[#3DDC84]" />
            <span className="hidden xs:inline">KEMBALI</span>
          </button>

          <div className="flex items-center gap-2 overflow-hidden truncate">
            {isPdf ? (
              <span className="p-1 rounded bg-rose-500/15 text-rose-400 shrink-0 border border-rose-500/30">
                <FileText size={13} />
              </span>
            ) : (
              <span className="p-1 rounded bg-[#3DDC84]/15 text-[#3DDC84] shrink-0 border border-[#3DDC84]/30">
                <FileArchive size={13} />
              </span>
            )}
            <h3
              className="text-xs font-mono font-bold truncate text-slate-200 uppercase tracking-tight"
              title={title}
            >
              {title}
            </h3>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {totalPages > 0 && (
            <>
              {/* Page Count Badge */}
              <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-[#0F111A] border border-slate-800 text-[11px] font-mono text-slate-300">
                <span className="text-[#3DDC84] font-bold">HAL {currentPage}</span>
                <span className="text-slate-500">/</span>
                <span>{totalPages}</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center bg-[#0F111A] border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.max(50, prev - 15))}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Perkecil"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-[11px] font-mono text-[#3DDC84] w-10 text-center font-bold">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.min(200, prev + 15))}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Perbesar"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="hidden sm:flex p-1.5 rounded-lg bg-[#0F111A] hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="Mode Layar Penuh"
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </>
          )}

          {/* Download Original File */}
          {fileBlob && (
            <button
              type="button"
              onClick={() => triggerDownload(fileBlob, title)}
              className="p-1.5 rounded-lg bg-[#0F111A] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Unduh Salinan File"
            >
              <Download size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Reader Canvas Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-[#0F111A] flex flex-col items-center p-2 sm:p-4 relative"
      >
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-3 font-mono">
            <Loader2 size={36} className="animate-spin text-[#3DDC84]" />
            <p className="text-xs uppercase tracking-wider text-slate-300 font-bold">
              {isPdf ? 'Membuka PDF & Merender Halaman...' : 'Membuka Arsip Komik Instan...'}
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs text-center">
              Menggunakan sistem pembaca on-demand berkecepatan tinggi agar bebas lagging dan hemat memori RAM.
            </p>
          </div>
        )}

        {error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md my-auto space-y-3 bg-[#161925] border border-rose-900/50 rounded-2xl">
            <AlertTriangle size={36} className="text-rose-500" />
            <h4 className="text-sm font-mono font-bold text-white">Gagal Memuat Komik</h4>
            <p className="text-xs font-mono text-slate-300 leading-relaxed">{error}</p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#0F111A] border border-slate-700 text-white text-xs font-mono font-bold hover:bg-slate-800"
              >
                TUTUP
              </button>
              {fileBlob && (
                <button
                  type="button"
                  onClick={() => triggerDownload(fileBlob, title)}
                  className="px-4 py-2 rounded-lg bg-[#3DDC84] text-[#0F111A] text-xs font-mono font-bold hover:bg-[#32c974]"
                >
                  UNDUH MANUAL
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && session && totalPages > 0 && (
          <div
            className="flex flex-col items-center space-y-3 transition-all duration-150 w-full"
            style={{ width: `${zoomLevel}%`, maxWidth: '960px' }}
          >
            {Array.from({ length: totalPages }).map((_, index) => (
              <MangaPageItem
                key={index}
                index={index}
                totalPages={totalPages}
                session={session}
                onVisible={(pageIndex) => setCurrentPage(pageIndex + 1)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Navigator for Quick Page Jump */}
      {!loading && !error && totalPages > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#161925]/95 backdrop-blur-md border border-slate-700/80 rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 text-xs font-mono">
          <button
            type="button"
            onClick={() => scrollToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded-full text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="text-[#3DDC84]">{currentPage}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300">{totalPages}</span>
          </div>

          <input
            type="range"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => scrollToPage(Number(e.target.value))}
            className="w-24 sm:w-36 accent-[#3DDC84] cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
            title="Geser halaman"
          />

          <button
            type="button"
            onClick={() => scrollToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-full text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800"
            title="Halaman Selanjutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
