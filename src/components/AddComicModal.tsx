import React, { useState } from 'react';
import { X, Sparkles, BookOpen, User, Layers, FolderOpen } from 'lucide-react';
import { OFFLINE_AUTOCOMPLETE_DATABASE } from '../data/offlineComics';
import { ComicItem } from '../types';

interface AddComicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddComic: (comic: Omit<ComicItem, 'id'>) => void;
  availableFolders: string[];
}

export const AddComicModal: React.FC<AddComicModalProps> = ({
  isOpen,
  onClose,
  onAddComic,
  availableFolders
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalVolumes, setTotalVolumes] = useState(12);
  const [type, setType] = useState<'reguler' | 'bindup'>('reguler');
  const [mangaLinkFolder, setMangaLinkFolder] = useState('');
  const [suggestions, setSuggestions] = useState<typeof OFFLINE_AUTOCOMPLETE_DATABASE>([]);
  const [statusText, setStatusText] = useState('');

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const query = val.trim().toLowerCase();

    if (!query) {
      setSuggestions([]);
      setStatusText('');
      return;
    }

    const matched = OFFLINE_AUTOCOMPLETE_DATABASE.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.keywords.some((k) => k.toLowerCase().includes(query))
    );

    if (matched.length > 0) {
      setSuggestions(matched);
      setStatusText('⚡ Data ditemukan di database offline!');
    } else {
      setSuggestions([]);
      setStatusText('ℹ️ Judul belum ada di database offline. Silakan isi manual.');
    }
  };

  const handleSelectSuggestion = (item: (typeof OFFLINE_AUTOCOMPLETE_DATABASE)[0]) => {
    setTitle(item.title);
    setAuthor(item.author);
    setTotalVolumes(item.volumes);
    if (item.type) {
      setType(item.type);
    }
    setSuggestions([]);
    setStatusText('✅ Berhasil mengisi otomatis dari database!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || totalVolumes < 1) return;

    onAddComic({
      title: title.trim(),
      author: author.trim(),
      totalVolumes: Number(totalVolumes),
      type,
      mangaLinkFolder: mangaLinkFolder.trim()
    });

    // Reset form
    setTitle('');
    setAuthor('');
    setTotalVolumes(12);
    setType('reguler');
    setMangaLinkFolder('');
    setSuggestions([]);
    setStatusText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#161925] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1C202F]">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="w-5 h-5 bg-[#3DDC84] rounded flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#0F111A] rotate-45"></div>
            </div>
            <h3 className="font-mono font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              TAMBAH KOMIK BARU
            </h3>
          </div>
          <button
            id="btn-close-add-modal"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto font-sans">
          {/* Title Input with Autocomplete */}
          <div className="relative">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5">
              Judul Komik
            </label>
            <div className="relative">
              <input
                id="input-comic-title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ketik judul (contoh: Punpun, One Piece, Frieren)..."
                required
                autoComplete="off"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] transition-all"
              />
              <Sparkles className="absolute right-3 top-2.5 text-[#3DDC84] pointer-events-none" size={15} />
            </div>

            {statusText && (
              <p className="text-[11px] font-mono text-emerald-600 dark:text-[#3DDC84] mt-1">
                {statusText}
              </p>
            )}

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#12141F] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-[#161925] transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#3DDC84]">
                        {item.title}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {item.author} • {item.volumes} Vol {item.type === 'bindup' ? '(Bind-Up)' : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-[#3DDC84] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      PILIH ↵
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Author Input */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <User size={13} />
              Nama Author / Mangaka
            </label>
            <input
              id="input-comic-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Masukkan nama author (contoh: Inio Asano)..."
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] transition-all"
            />
          </div>

          {/* Total Volume */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Layers size={13} />
              Total Volume Rilis
            </label>
            <input
              id="input-comic-volumes"
              type="number"
              min="1"
              max="999"
              value={totalVolumes}
              onChange={(e) => setTotalVolumes(Math.max(1, parseInt(e.target.value) || 1))}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] transition-all"
            />
          </div>

          {/* Link Folder Manga Reader */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FolderOpen size={13} />
              Hubungkan ke Folder Manga Reader
            </label>
            <select
              id="select-manga-folder-link"
              value={mangaLinkFolder}
              onChange={(e) => setMangaLinkFolder(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0F111A] text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden focus:border-[#3DDC84] focus:ring-1 focus:ring-[#3DDC84] transition-all"
            >
              <option value="">-- Pilih Folder Manga Reader (Opsional) --</option>
              {availableFolders.map((f) => (
                <option key={f} value={f}>
                  📁 {f}
                </option>
              ))}
            </select>
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
              Jika dihubungkan, Anda dapat membuka bab/volume manga langsung dari kartu komik.
            </p>
          </div>

          {/* Format Type (Regular vs Bind-up) */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5">
              Tipe Format Komik
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  type === 'reguler'
                    ? 'border-[#3DDC84] bg-[#3DDC84]/10 text-[#3DDC84] font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#12141F] text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="comic-type"
                  value="reguler"
                  checked={type === 'reguler'}
                  onChange={() => setType('reguler')}
                  className="accent-[#3DDC84]"
                />
                <span className="text-xs font-mono">Regular Edition</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  type === 'bindup'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#12141F] text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="comic-type"
                  value="bindup"
                  checked={type === 'bindup'}
                  onChange={() => setType('bindup')}
                  className="accent-rose-500"
                />
                <span className="text-xs font-mono">Bind-Up / Omnibus</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-comic"
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] active:scale-[0.98] text-[#0F111A] font-mono font-bold text-xs tracking-tight shadow-md transition-all uppercase"
            >
              Simpan ke Database Katalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
