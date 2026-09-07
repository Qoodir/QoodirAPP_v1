export interface ComicItem {
  id: number;
  title: string;
  author: string;
  totalVolumes: number;
  type: 'reguler' | 'bindup';
  mangaLinkFolder: string;
  orderIndex?: number;
  notes?: string;
}

export type OwnedVolumesMap = Record<number, number[]>;

export interface MangaFileRecord {
  id?: number;
  fileName: string;
  fileSize: string;
  fileData: Blob;
  folder: string;
  uploadedAt: string;
  status: 'Belum Dibaca' | 'Sedang Dibaca' | 'Selesai';
  bookmark?: string;
  pageCount?: number;
}

export interface MusicTrackRecord {
  id?: number;
  title: string;
  fileName: string;
  fileData: Blob;
  folder: string;
  uploadedAt: string;
  duration?: number;
}

export interface VideoItem {
  name: string;
  folder: string;
  file?: File | Blob;
  size?: string;
  lastResumeTime?: number;
}

export interface KotlinFilePreview {
  name: string;
  category: 'Entity' | 'DAO' | 'Database' | 'Repository' | 'ViewModel' | 'UI Screen' | 'Gradle' | 'Manifest';
  code: string;
  description: string;
}
