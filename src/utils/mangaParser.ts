import JSZip from 'jszip';
export { createArchiveSession, createPdfSession } from './mangaArchive';
export type { MangaReaderSession } from './mangaArchive';

export async function extractImagesFromArchive(fileBlob: Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(fileBlob);
  const imageFiles = Object.keys(zip.files)
    .filter((name) => {
      const entry = zip.files[name];
      if (!entry || entry.dir) return false;
      const parts = name.split('/');
      const isHidden = name.startsWith('__MACOSX/') || parts.some((p) => p.startsWith('.'));
      if (isHidden) return false;
      return /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(name);
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const imageUrls: string[] = [];
  // Extract in small chunks to avoid blocking the main thread
  for (const filename of imageFiles) {
    const blob = await zip.files[filename].async('blob');
    imageUrls.push(URL.createObjectURL(blob));
  }
  return imageUrls;
}

export function isArchiveFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.zip') || lower.endsWith('.cbz') || lower.endsWith('.cbr');
}

export function isPdfFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.pdf');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ParsedFolder {
  mainFolder: string;
  subFolder: string | null;
  fullPath: string;
}

export function parseFolder(folderName?: string): ParsedFolder {
  if (!folderName || folderName === 'Tanpa Folder' || !folderName.trim()) {
    return {
      mainFolder: 'Tanpa Folder',
      subFolder: null,
      fullPath: 'Tanpa Folder'
    };
  }

  // Handle slashes: / or \ or " > "
  const normalized = folderName.replace(/\\/g, '/').replace(/\s*>\s*/g, '/');
  const parts = normalized.split('/').map((s) => s.trim()).filter(Boolean);

  if (parts.length === 0) {
    return {
      mainFolder: 'Tanpa Folder',
      subFolder: null,
      fullPath: 'Tanpa Folder'
    };
  }

  if (parts.length === 1) {
    return {
      mainFolder: parts[0],
      subFolder: null,
      fullPath: parts[0]
    };
  }

  return {
    mainFolder: parts[0],
    subFolder: parts.slice(1).join('/'),
    fullPath: `${parts[0]}/${parts.slice(1).join('/')}`
  };
}

