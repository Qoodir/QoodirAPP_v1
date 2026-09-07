import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdfjs worker in Vite
try {
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

export interface MangaReaderSession {
  type: 'archive' | 'pdf';
  totalCount: number;
  getPageUrl: (index: number) => Promise<string>;
  destroy: () => void;
}

const MAX_CACHE_SIZE = 25;

/**
 * Creates an ultra-fast on-demand CBZ / ZIP reader session.
 * Loads the central directory in ~100ms instead of uncompressing all images up-front.
 * Prevents mobile memory overflow ("mental") and eliminates long loading freezes.
 */
export async function createArchiveSession(fileBlob: Blob): Promise<MangaReaderSession> {
  const zip = await JSZip.loadAsync(fileBlob);

  // Filter image entries robustly
  const allKeys = Object.keys(zip.files);
  let imageFiles = allKeys
    .filter((name) => {
      const entry = zip.files[name];
      if (!entry || entry.dir) return false;

      // Ignore macOS metadata and hidden system files
      const parts = name.split('/');
      const isHidden = name.startsWith('__MACOSX/') || parts.some((p) => p.startsWith('.'));
      if (isHidden) return false;

      // Check image extensions
      return /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(name);
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  // Fallback: If no standard image extensions found, find files with size > 10KB that aren't text/json/xml
  if (imageFiles.length === 0) {
    imageFiles = allKeys
      .filter((name) => {
        const entry = zip.files[name];
        if (!entry || entry.dir) return false;
        const lower = name.toLowerCase();
        if (lower.endsWith('.txt') || lower.endsWith('.xml') || lower.endsWith('.json')) return false;
        return !name.startsWith('__MACOSX/');
      })
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }

  if (imageFiles.length === 0) {
    throw new Error('Tidak ada file gambar yang valid di dalam arsip CBZ/ZIP ini.');
  }

  const urlCache = new Map<number, string>();
  const accessOrder: number[] = [];

  const getPageUrl = async (index: number): Promise<string> => {
    if (index < 0 || index >= imageFiles.length) {
      throw new Error(`Indeks halaman di luar rentang: ${index}`);
    }

    if (urlCache.has(index)) {
      return urlCache.get(index)!;
    }

    const filename = imageFiles[index];
    const zipEntry = zip.files[filename];
    if (!zipEntry) {
      throw new Error(`File ${filename} tidak ditemukan dalam arsip.`);
    }

    const rawBlob = await zipEntry.async('blob');
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mime =
      ext === 'png'
        ? 'image/png'
        : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
        ? 'image/gif'
        : ext === 'avif'
        ? 'image/avif'
        : 'image/jpeg';
    const blob = new Blob([rawBlob], { type: mime });
    const objectUrl = URL.createObjectURL(blob);

    // Keep cache at reasonable limit without aggressive early eviction
    if (urlCache.size >= 50) {
      const oldest = accessOrder.shift();
      if (oldest !== undefined && oldest !== index) {
        const oldUrl = urlCache.get(oldest);
        if (oldUrl) {
          try {
            URL.revokeObjectURL(oldUrl);
          } catch {
            // ignore
          }
        }
        urlCache.delete(oldest);
      }
    }

    urlCache.set(index, objectUrl);
    accessOrder.push(index);

    return objectUrl;
  };

  const destroy = () => {
    urlCache.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    urlCache.clear();
    accessOrder.length = 0;
  };

  return {
    type: 'archive',
    totalCount: imageFiles.length,
    getPageUrl,
    destroy
  };
}

/**
 * Creates a direct PDF reader session using PDF.js.
 * Renders pages immediately without requiring external clicks or iframe downloads on mobile devices.
 */
export async function createPdfSession(fileBlob: Blob): Promise<MangaReaderSession> {
  const arrayBuffer = await fileBlob.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true
  });

  const pdfDoc = await loadingTask.promise;
  const totalCount = pdfDoc.numPages;

  if (totalCount === 0) {
    throw new Error('Dokumen PDF tidak memiliki halaman.');
  }

  const urlCache = new Map<number, string>();
  const accessOrder: number[] = [];

  const getPageUrl = async (index: number): Promise<string> => {
    if (index < 0 || index >= totalCount) {
      throw new Error(`Indeks halaman PDF di luar rentang: ${index}`);
    }

    if (urlCache.has(index)) {
      return urlCache.get(index)!;
    }

    const pageNumber = index + 1;
    const page = await pdfDoc.getPage(pageNumber);

    // Render at optimal resolution for mobile & desktop (1.5x scale)
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Gagal menginisialisasi canvas untuk render PDF.');
    }

    await page.render({
      canvas,
      canvasContext: ctx,
      viewport
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Gagal mengonversi halaman PDF ke gambar.'));
        },
        'image/jpeg',
        0.88
      );
    });

    const objectUrl = URL.createObjectURL(blob);

    // Evict oldest if cache exceeds limit to protect memory on Android
    if (urlCache.size >= MAX_CACHE_SIZE) {
      const oldest = accessOrder.shift();
      if (oldest !== undefined && oldest !== index) {
        const oldUrl = urlCache.get(oldest);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        urlCache.delete(oldest);
      }
    }

    urlCache.set(index, objectUrl);
    accessOrder.push(index);

    return objectUrl;
  };

  const destroy = () => {
    urlCache.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    urlCache.clear();
    accessOrder.length = 0;
    try {
      pdfDoc.cleanup();
      loadingTask.destroy();
    } catch {
      // ignore
    }
  };

  return {
    type: 'pdf',
    totalCount,
    getPageUrl,
    destroy
  };
}
