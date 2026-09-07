import { MangaFileRecord, MusicTrackRecord, ComicItem, OwnedVolumesMap } from '../types';
import { INITIAL_CATALOG, INITIAL_OWNED_VOLUMES } from '../data/offlineComics';

const DB_NAME = 'StandaloneAppDatabase';
const DB_VERSION = 4;

let dbInstance: IDBDatabase | null = null;

export async function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('comics')) {
        const comicStore = db.createObjectStore('comics', { keyPath: 'id' });
        comicStore.createIndex('type', 'type', { unique: false });
      }

      if (!db.objectStoreNames.contains('owned_volumes')) {
        db.createObjectStore('owned_volumes', { keyPath: 'comicId' });
      }

      if (!db.objectStoreNames.contains('manga_pdfs')) {
        const mangaStore = db.createObjectStore('manga_pdfs', { keyPath: 'id', autoIncrement: true });
        mangaStore.createIndex('folder', 'folder', { unique: false });
        mangaStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains('offline_music')) {
        const musicStore = db.createObjectStore('offline_music', { keyPath: 'id', autoIncrement: true });
        musicStore.createIndex('folder', 'folder', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Comics & Volumes operations
export async function getComicsFromDb(): Promise<ComicItem[]> {
  const db = await getDb();
  return new Promise((resolve) => {
    const tx = db.transaction('comics', 'readonly');
    const store = tx.objectStore('comics');
    const req = store.getAll();

    req.onsuccess = () => {
      const items = req.result as ComicItem[];
      if (!items || items.length === 0) {
        // Seed initial data if empty
        seedInitialData().then(resolve);
      } else {
        resolve(items);
      }
    };

    req.onerror = () => {
      resolve(INITIAL_CATALOG);
    };
  });
}

export async function saveComicsToDb(comics: ComicItem[]): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('comics', 'readwrite');
    const store = tx.objectStore('comics');
    store.clear();
    comics.forEach((comic) => store.put(comic));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOwnedVolumesFromDb(): Promise<OwnedVolumesMap> {
  const db = await getDb();
  return new Promise((resolve) => {
    const tx = db.transaction('owned_volumes', 'readonly');
    const store = tx.objectStore('owned_volumes');
    const req = store.getAll();

    req.onsuccess = () => {
      const results = req.result as { comicId: number; volumes: number[] }[];
      if (!results || results.length === 0) {
        resolve(INITIAL_OWNED_VOLUMES);
      } else {
        const map: OwnedVolumesMap = {};
        results.forEach((r) => {
          map[r.comicId] = r.volumes;
        });
        resolve(map);
      }
    };

    req.onerror = () => resolve(INITIAL_OWNED_VOLUMES);
  });
}

export async function saveOwnedVolumesToDb(ownedMap: OwnedVolumesMap): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('owned_volumes', 'readwrite');
    const store = tx.objectStore('owned_volumes');
    store.clear();

    Object.entries(ownedMap).forEach(([idStr, volumes]) => {
      store.put({ comicId: Number(idStr), volumes });
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function seedInitialData(): Promise<ComicItem[]> {
  const db = await getDb();
  const tx = db.transaction(['comics', 'owned_volumes'], 'readwrite');
  const comicStore = tx.objectStore('comics');
  const ownedStore = tx.objectStore('owned_volumes');

  INITIAL_CATALOG.forEach((comic) => comicStore.put(comic));
  Object.entries(INITIAL_OWNED_VOLUMES).forEach(([idStr, volumes]) => {
    ownedStore.put({ comicId: Number(idStr), volumes });
  });

  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(INITIAL_CATALOG);
  });
}

// Manga PDF/CBZ/ZIP operations
export async function getAllMangaFiles(): Promise<MangaFileRecord[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('manga_pdfs', 'readonly');
    const store = tx.objectStore('manga_pdfs');
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result as MangaFileRecord[]);
    req.onerror = () => reject(req.error);
  });
}

export async function addMangaFile(record: Omit<MangaFileRecord, 'id'>): Promise<number> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('manga_pdfs', 'readwrite');
    const store = tx.objectStore('manga_pdfs');
    const req = store.add(record);

    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteMangaFile(id: number): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('manga_pdfs', 'readwrite');
    const store = tx.objectStore('manga_pdfs');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updateMangaStatus(id: number, status: 'Belum Dibaca' | 'Sedang Dibaca' | 'Selesai'): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('manga_pdfs', 'readwrite');
    const store = tx.objectStore('manga_pdfs');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as MangaFileRecord;
      if (item) {
        item.status = status;
        store.put(item);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function updateMangaFolder(id: number, folder: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('manga_pdfs', 'readwrite');
    const store = tx.objectStore('manga_pdfs');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as MangaFileRecord;
      if (item) {
        item.folder = folder;
        store.put(item);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// Offline Music operations
export async function getAllMusicTracks(): Promise<MusicTrackRecord[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_music', 'readonly');
    const store = tx.objectStore('offline_music');
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result as MusicTrackRecord[]);
    req.onerror = () => reject(req.error);
  });
}

export async function addMusicTrack(track: Omit<MusicTrackRecord, 'id'>): Promise<number> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_music', 'readwrite');
    const store = tx.objectStore('offline_music');
    const req = store.add(track);

    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteMusicTrack(id: number): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_music', 'readwrite');
    const store = tx.objectStore('offline_music');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
