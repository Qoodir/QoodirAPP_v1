import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Copy,
  Check,
  Download,
  Calendar,
  Sparkles,
  X,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Maximize2
} from 'lucide-react';
import { NoteItem } from '../types';
import { INITIAL_NOTES } from '../data/initialNotes';

interface NotepadProps {
  // Optional external trigger or props
}

const COLOR_MAP: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  emerald: {
    bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    text: 'text-emerald-700 dark:text-[#3DDC84]'
  },
  blue: {
    bg: 'bg-blue-500/5 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/30',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400'
  },
  amber: {
    bg: 'bg-amber-500/5 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400'
  },
  purple: {
    bg: 'bg-purple-500/5 dark:bg-purple-500/10',
    border: 'border-purple-200 dark:border-purple-500/30',
    badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400'
  },
  rose: {
    bg: 'bg-rose-500/5 dark:bg-rose-500/10',
    border: 'border-rose-200 dark:border-rose-500/30',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400'
  }
};

export const Notepad: React.FC<NotepadProps> = () => {
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('comic_app_notepad');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading notes:', e);
    }
    return INITIAL_NOTES;
  });

  // Master PIN for privacy protection (default: 1234)
  const [masterPin, setMasterPin] = useState<string>(() => {
    return localStorage.getItem('comic_app_notepad_master_pin') || '1234';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Full View Reader Modal State
  const [viewingNote, setViewingNote] = useState<NoteItem | null>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // Editor form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<NoteItem['category']>('Komik');
  const [formColor, setFormColor] = useState<NoteItem['color']>('emerald');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formIsLocked, setFormIsLocked] = useState(false);
  const [formCustomPassword, setFormCustomPassword] = useState('');
  const [formUseCustomPassword, setFormUseCustomPassword] = useState(false);
  const [showPasswordInEditor, setShowPasswordInEditor] = useState(false);

  // Verification Password / PIN Dialog State
  const [unlockDialog, setUnlockDialog] = useState<{
    isOpen: boolean;
    note: NoteItem;
    action: 'view' | 'edit' | 'copy' | 'download';
    inputPassword: string;
    showPassword: boolean;
    error: string | null;
  } | null>(null);

  // Master PIN Setting Modal
  const [isPinSettingOpen, setIsPinSettingOpen] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinSettingError, setPinSettingError] = useState<string | null>(null);
  const [pinSettingSuccess, setPinSettingSuccess] = useState(false);

  // Clipboard & Delete Modal
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('comic_app_notepad', JSON.stringify(notes));
    } catch (e) {
      console.error('Error saving notes:', e);
    }
  }, [notes]);

  // Save master PIN
  useEffect(() => {
    try {
      localStorage.setItem('comic_app_notepad_master_pin', masterPin);
    } catch (e) {
      console.error('Error saving master pin:', e);
    }
  }, [masterPin]);

  // Open Full View or prompt password if locked
  const handleNoteClick = (note: NoteItem) => {
    if (note.isLocked) {
      setUnlockDialog({
        isOpen: true,
        note,
        action: 'view',
        inputPassword: '',
        showPassword: false,
        error: null
      });
    } else {
      setViewingNote(note);
    }
  };

  const handleOpenAdd = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('Komik');
    setFormColor('emerald');
    setFormIsPinned(false);
    setFormIsLocked(false);
    setFormCustomPassword('');
    setFormUseCustomPassword(false);
    setShowPasswordInEditor(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (note: NoteItem) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category);
    setFormColor(note.color || 'emerald');
    setFormIsPinned(!!note.isPinned);
    setFormIsLocked(!!note.isLocked);
    setFormCustomPassword(note.password || '');
    setFormUseCustomPassword(!!note.password);
    setShowPasswordInEditor(false);
    setIsEditorOpen(true);
  };

  const handleRequestEdit = (note: NoteItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (note.isLocked) {
      setUnlockDialog({
        isOpen: true,
        note,
        action: 'edit',
        inputPassword: '',
        showPassword: false,
        error: null
      });
    } else {
      handleOpenEdit(note);
    }
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockDialog) return;

    const { note, action, inputPassword } = unlockDialog;
    const requiredPassword = note.password || masterPin;

    if (inputPassword === requiredPassword || inputPassword === masterPin) {
      // Password correct!
      const targetNote = note;
      setUnlockDialog(null);

      if (action === 'view') {
        setViewingNote(targetNote);
      } else if (action === 'edit') {
        handleOpenEdit(targetNote);
      } else if (action === 'copy') {
        executeCopy(targetNote);
      } else if (action === 'download') {
        executeDownload(targetNote);
      }
    } else {
      setUnlockDialog((prev) =>
        prev
          ? {
              ...prev,
              error: 'Password atau PIN salah. Silakan coba lagi.'
            }
          : null
      );
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const passwordToStore = formIsLocked
      ? formUseCustomPassword && formCustomPassword.trim()
        ? formCustomPassword.trim()
        : undefined
      : undefined;

    if (editingNote) {
      const updatedNote: NoteItem = {
        ...editingNote,
        title: formTitle.trim(),
        content: formContent,
        category: formCategory,
        color: formColor,
        isPinned: formIsPinned,
        isLocked: formIsLocked,
        password: passwordToStore,
        updatedAt: Date.now()
      };

      setNotes((prev) =>
        prev.map((n) => (n.id === editingNote.id ? updatedNote : n))
      );

      // If this note is currently open in full view, update it too
      if (viewingNote && viewingNote.id === editingNote.id) {
        setViewingNote(updatedNote);
      }
    } else {
      const newNote: NoteItem = {
        id: `note-${Date.now()}`,
        title: formTitle.trim(),
        content: formContent,
        category: formCategory,
        color: formColor,
        isPinned: formIsPinned,
        isLocked: formIsLocked,
        password: passwordToStore,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setNotes((prev) => [newNote, ...prev]);
    }

    setIsEditorOpen(false);
  };

  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const updated = { ...n, isPinned: !n.isPinned };
          if (viewingNote && viewingNote.id === id) {
            setViewingNote(updated);
          }
          return updated;
        }
        return n;
      })
    );
  };

  const handleToggleLockInFullView = (note: NoteItem) => {
    const newLockState = !note.isLocked;
    const updated = {
      ...note,
      isLocked: newLockState,
      updatedAt: Date.now()
    };
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    setViewingNote(updated);
  };

  const handleDeleteConfirm = () => {
    if (!noteToDelete) return;
    setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
    if (viewingNote && viewingNote.id === noteToDelete.id) {
      setViewingNote(null);
    }
    setNoteToDelete(null);
  };

  const executeCopy = (note: NoteItem) => {
    const fullText = `${note.title}\n[${note.category}]\n\n${note.content}`;
    navigator.clipboard.writeText(fullText);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const handleCopyNote = (note: NoteItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (note.isLocked && !viewingNote) {
      setUnlockDialog({
        isOpen: true,
        note,
        action: 'copy',
        inputPassword: '',
        showPassword: false,
        error: null
      });
    } else {
      executeCopy(note);
    }
  };

  const executeDownload = (note: NoteItem) => {
    const fullText = `# ${note.title}\nKategori: ${note.category}\nTanggal: ${new Date(
      note.updatedAt
    ).toLocaleString('id-ID')}\n\n${note.content}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadNote = (note: NoteItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (note.isLocked && !viewingNote) {
      setUnlockDialog({
        isOpen: true,
        note,
        action: 'download',
        inputPassword: '',
        showPassword: false,
        error: null
      });
    } else {
      executeDownload(note);
    }
  };

  const handleSavePinSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinInput !== masterPin) {
      setPinSettingError('PIN saat ini tidak sesuai.');
      return;
    }
    if (newPinInput.length < 4) {
      setPinSettingError('PIN baru minimal 4 karakter/digit.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinSettingError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    setMasterPin(newPinInput);
    setPinSettingSuccess(true);
    setTimeout(() => {
      setIsPinSettingOpen(false);
      setPinSettingSuccess(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setPinSettingError(null);
    }, 1200);
  };

  const handleInsertTemplate = (type: 'wishlist' | 'review' | 'volumes') => {
    if (type === 'wishlist') {
      setFormTitle('Wishlist Komik ' + new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }));
      setFormCategory('Wishlist');
      setFormColor('emerald');
      setFormContent(`- [ ] Judul Komik Vol. X (Target: Rp ...)\n- [ ] Judul Komik Vol. Y\n- [ ] Edisi Bind-up / Kanzenban\n\nCatatan Toko / Marketplace:\n- Toko Official Gramedia\n- Promo Tanggal Kembar`);
    } else if (type === 'review') {
      setFormTitle('Review Komik: [Nama Judul]');
      setFormCategory('Review');
      setFormColor('blue');
      setFormContent(`Penulis / Mangaka: \nJumlah Volume: \nStatus Cerita: [Ongoing / Tamat]\n\nSinopsis Singkat:\n...\n\nPoin Menarik:\n1. Karakter & Perkembangan Cerita:\n2. Kualitas Gambar / Art Style:\n\nKekurangan:\n-\n\nRating Keseluruhan: 9/10`);
    } else if (type === 'volumes') {
      setFormTitle('Checklist Volume Belum Lengkap');
      setFormCategory('Komik');
      setFormColor('amber');
      setFormContent(`Daftar nomor volume yang belum dimiliki:\n\n1. Judul A: Vol. 3, 5, 8\n2. Judul B: Vol. 12, 14-16\n3. Judul C: Edisi Spesial / Limited Variant\n\nRencana Pembelian Selanjutnya:\n- `);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (!n.isLocked && n.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'Semua' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const regularNotes = filteredNotes.filter((n) => !n.isPinned);

  const categories = ['Semua', 'Komik', 'Wishlist', 'Review', 'Umum'];
  const colors: Array<NoteItem['color']> = ['emerald', 'blue', 'amber', 'purple', 'rose'];

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Banner / Actions */}
      <div className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 dark:bg-[#3DDC84]/20 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-[#3DDC84] shrink-0 shadow-2xs">
              <FileText size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Notepad & Catatan Komik
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {notes.length} Catatan
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Klik catatan untuk baca full • Mendukung kunci privasi dengan password/PIN
              </p>
            </div>
          </div>

          {/* Top Actions: Master PIN & New Note */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-settings-pin"
              type="button"
              onClick={() => {
                setCurrentPinInput('');
                setNewPinInput('');
                setConfirmPinInput('');
                setPinSettingError(null);
                setPinSettingSuccess(false);
                setIsPinSettingOpen(true);
              }}
              title="Atur PIN Master Privasi Catatan"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#12141F] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <KeyRound size={15} className="text-emerald-600 dark:text-[#3DDC84]" />
              <span className="hidden md:inline">PIN Privasi</span>
            </button>

            <button
              id="btn-add-new-note"
              type="button"
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3DDC84] hover:bg-[#32c974] active:scale-95 text-[#0F111A] font-bold text-xs shadow-sm shadow-[#3DDC84]/20 transition-all cursor-pointer"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>CATATAN BARU</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="input-search-notes"
              type="text"
              placeholder="Cari judul atau isi catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#3DDC84] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-[#12141F] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredNotes.length === 0 && (
        <div className="bg-white dark:bg-[#161925] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-[#12141F] flex items-center justify-center text-slate-400">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {searchQuery ? 'Tidak Ada Catatan yang Cocok' : 'Belum Ada Catatan'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {searchQuery
                ? `Tidak ditemukan catatan dengan kata kunci "${searchQuery}".`
                : 'Mulai buat catatan wishlist komik atau review buku favorit Anda.'}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3DDC84] text-[#0F111A] text-xs font-bold font-mono hover:bg-[#32c974] transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Tambah Catatan</span>
          </button>
        </div>
      )}

      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 px-1">
            <Pin size={13} className="text-[#3DDC84] fill-[#3DDC84]" />
            <span>DISEMATKAN ({pinnedNotes.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pinnedNotes.map((note) => renderNoteCard(note))}
          </div>
        </div>
      )}

      {/* Regular Notes Section */}
      {regularNotes.length > 0 && (
        <div className="space-y-2.5">
          {pinnedNotes.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 px-1 pt-2">
              <FileText size={13} />
              <span>CATATAN LAINNYA ({regularNotes.length})</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {regularNotes.map((note) => renderNoteCard(note))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: FULL ISI CATATAN (CLEAR, READABLE & COMPACT TOP) */}
      {/* ========================================================= */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#161925] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title, Badges, and Top Action Icons Bar */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#12141F] flex items-center justify-between gap-3">
              {/* Left: Badges & Title */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      (COLOR_MAP[viewingNote.color || 'emerald'] || COLOR_MAP.emerald).badge
                    }`}
                  >
                    {viewingNote.category}
                  </span>

                  {viewingNote.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#3DDC84] bg-[#3DDC84]/15 px-1.5 py-0.5 rounded border border-[#3DDC84]/30">
                      <Pin size={10} className="fill-[#3DDC84]" />
                      PIN
                    </span>
                  )}

                  {viewingNote.isLocked && (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">
                      <Lock size={10} />
                      PRIVAT
                    </span>
                  )}
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug truncate">
                  {viewingNote.title}
                </h2>
              </div>

              {/* Right: Icon-only Action Buttons Bar (Hanya Logo/Icon) */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingNote;
                    setViewingNote(null);
                    handleOpenEdit(target);
                  }}
                  title="Edit Catatan"
                  className="w-8 h-8 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] active:scale-95 text-[#0F111A] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit3 size={15} className="stroke-[2.5]" />
                </button>

                {/* Pin Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleTogglePin(viewingNote.id)}
                  title={viewingNote.isPinned ? 'Batal Sematkan' : 'Sematkan'}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    viewingNote.isPinned
                      ? 'bg-[#3DDC84]/20 border-[#3DDC84]/40 text-[#3DDC84]'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161925] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Pin size={14} className={viewingNote.isPinned ? 'fill-[#3DDC84]' : ''} />
                </button>

                {/* Lock Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleLockInFullView(viewingNote)}
                  title={viewingNote.isLocked ? 'Buka Kunci Catatan' : 'Kunci Privasi'}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    viewingNote.isLocked
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-600 dark:text-purple-400'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161925] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {viewingNote.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={() => handleCopyNote(viewingNote)}
                  title="Salin Teks"
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161925] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  {copiedNoteId === viewingNote.id ? (
                    <Check size={14} className="text-[#3DDC84]" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>

                {/* Download TXT Button */}
                <button
                  type="button"
                  onClick={() => handleDownloadNote(viewingNote)}
                  title="Unduh TXT"
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161925] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Download size={14} />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setNoteToDelete(viewingNote)}
                  title="Hapus Catatan"
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161925] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setViewingNote(null)}
                  title="Tutup"
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161925] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Content Display: Always 14px (text-[14px]), line-height comfortable & selectable */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-[#161925]">
              <div className="text-[14px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-sans leading-relaxed tracking-wide select-text">
                {viewingNote.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: VERIFIKASI PASSWORD / PIN (UNTUK CATATAN PRIVAT) */}
      {/* ========================================================= */}
      {unlockDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white dark:bg-[#161925] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  CATATAN TERKUNCI
                </h3>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Masukkan PIN atau Password Privasi
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#0F111A] rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                "{unlockDialog.note.title}"
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Catatan ini diproteksi agar tidak dapat dibaca orang lain.
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  PIN / Password
                </label>
                <div className="relative">
                  <input
                    type={unlockDialog.showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    placeholder="Masukkan PIN / Sandi..."
                    value={unlockDialog.inputPassword}
                    onChange={(e) =>
                      setUnlockDialog((prev) =>
                        prev
                          ? { ...prev, inputPassword: e.target.value, error: null }
                          : null
                      )
                    }
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-[#3DDC84]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setUnlockDialog((prev) =>
                        prev ? { ...prev, showPassword: !prev.showPassword } : null
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {unlockDialog.showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {unlockDialog.error && (
                  <p className="text-[11px] text-rose-500 font-mono font-bold">
                    {unlockDialog.error}
                  </p>
                )}

                <p className="text-[10px] font-mono text-slate-400">
                  Tip: Masukkan PIN Master (bawaan: <span className="text-[#3DDC84] font-bold">1234</span>) atau password khusus catatan ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUnlockDialog(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3DDC84] hover:bg-[#32c974] active:scale-95 text-[#0F111A] font-mono font-bold text-xs shadow-xs cursor-pointer"
                >
                  BUKA CATATAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: PENGATURAN MASTER PIN PRIVASI                    */}
      {/* ========================================================= */}
      {isPinSettingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white dark:bg-[#161925] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-[#3DDC84] flex items-center justify-center shrink-0">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    PIN MASTER PRIVASI
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    PIN induk untuk semua catatan privat
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPinSettingOpen(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F111A] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {pinSettingSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1">
                <Check size={24} className="text-[#3DDC84] mx-auto" />
                <p className="text-xs font-mono font-bold text-emerald-700 dark:text-[#3DDC84]">
                  PIN Master Berhasil Diperbarui!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSavePinSettings} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    PIN Saat Ini *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Bawaan: 1234"
                    value={currentPinInput}
                    onChange={(e) => {
                      setCurrentPinInput(e.target.value);
                      setPinSettingError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-[#3DDC84]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    PIN Baru (minimal 4 digit/karakter) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Contoh: 5678"
                    value={newPinInput}
                    onChange={(e) => {
                      setNewPinInput(e.target.value);
                      setPinSettingError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-[#3DDC84]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Konfirmasi PIN Baru *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Ulangi PIN baru"
                    value={confirmPinInput}
                    onChange={(e) => {
                      setConfirmPinInput(e.target.value);
                      setPinSettingError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-[#3DDC84]"
                  />
                </div>

                {pinSettingError && (
                  <p className="text-[11px] font-mono font-bold text-rose-500">
                    {pinSettingError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsPinSettingOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#3DDC84] hover:bg-[#32c974] text-[#0F111A] font-mono font-bold text-xs shadow-xs cursor-pointer"
                  >
                    SIMPAN PIN
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: EDITOR CATATAN (BUAT / EDIT)                    */}
      {/* ========================================================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white dark:bg-[#161925] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#12141F]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#3DDC84]/20 border border-[#3DDC84]/40 flex items-center justify-center text-[#3DDC84]">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingNote ? 'EDIT CATATAN' : 'CATATAN BARU'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Tersimpan otomatis di penyimpanan lokal offline
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F111A] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveNote} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Quick Template Buttons (only for new note) */}
              {!editingNote && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-500" />
                    Template Cepat:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('wishlist')}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-[#3DDC84] border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      + Wishlist Belanja
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('review')}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors cursor-pointer"
                    >
                      + Review Komik
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('volumes')}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    >
                      + Checklist Volume
                    </button>
                  </div>
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Judul Catatan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Wishlist Komik Gramedia / Review One Piece"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#3DDC84] font-medium"
                />
              </div>

              {/* Category & Pin & Color Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Kategori
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as NoteItem['category'])}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#3DDC84]"
                  >
                    <option value="Komik">Komik</option>
                    <option value="Wishlist">Wishlist</option>
                    <option value="Review">Review</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Aksen Warna & Pin
                  </label>
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800">
                    {/* Color picker */}
                    <div className="flex items-center gap-1.5 pl-1.5">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormColor(c)}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            c === 'emerald'
                              ? 'bg-emerald-500 border-emerald-600'
                              : c === 'blue'
                              ? 'bg-blue-500 border-blue-600'
                              : c === 'amber'
                              ? 'bg-amber-500 border-amber-600'
                              : c === 'purple'
                              ? 'bg-purple-500 border-purple-600'
                              : 'bg-rose-500 border-rose-600'
                          } ${formColor === c ? 'scale-125 ring-2 ring-slate-400 dark:ring-white' : 'opacity-70 hover:opacity-100'}`}
                        />
                      ))}
                    </div>

                    {/* Pin toggle */}
                    <button
                      type="button"
                      onClick={() => setFormIsPinned(!formIsPinned)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                        formIsPinned
                          ? 'bg-[#3DDC84]/20 text-[#3DDC84] font-bold border border-[#3DDC84]/40'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                      title={formIsPinned ? 'Sematkan di atas' : 'Batal sematkan'}
                    >
                      <Pin size={12} className={formIsPinned ? 'fill-[#3DDC84]' : ''} />
                      <span>{formIsPinned ? 'Disematkan' : 'Pin'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* PRIVACY & PASSWORD PROTECTION CARD */}
              <div className="p-3.5 rounded-xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={15} className="text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        Kunci Privasi Catatan
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Memerlukan PIN/Password untuk membuka isi catatan
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormIsLocked(!formIsLocked)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      formIsLocked ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        formIsLocked ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {formIsLocked && (
                  <div className="pt-2 border-t border-purple-200/60 dark:border-purple-500/20 space-y-2">
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                        <input
                          type="radio"
                          name="pwdType"
                          checked={!formUseCustomPassword}
                          onChange={() => setFormUseCustomPassword(false)}
                          className="accent-[#3DDC84]"
                        />
                        <span>Gunakan PIN Master</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                        <input
                          type="radio"
                          name="pwdType"
                          checked={formUseCustomPassword}
                          onChange={() => setFormUseCustomPassword(true)}
                          className="accent-[#3DDC84]"
                        />
                        <span>Password Khusus</span>
                      </label>
                    </div>

                    {formUseCustomPassword ? (
                      <div className="relative">
                        <input
                          type={showPasswordInEditor ? 'text' : 'password'}
                          required={formIsLocked && formUseCustomPassword}
                          placeholder="Masukkan password khusus untuk catatan ini..."
                          value={formCustomPassword}
                          onChange={(e) => setFormCustomPassword(e.target.value)}
                          className="w-full pl-3 pr-10 py-2 rounded-xl bg-white dark:bg-[#0F111A] border border-purple-300 dark:border-purple-500/40 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordInEditor(!showPasswordInEditor)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPasswordInEditor ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Catatan akan diproteksi dengan PIN Master Anda (bawaan: <span className="font-bold text-[#3DDC84]">1234</span>).
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Content textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Isi Catatan
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formContent.length} karakter • {formContent.trim() ? formContent.trim().split(/\s+/).length : 0} kata
                  </span>
                </div>
                <textarea
                  rows={8}
                  placeholder="Tulis detail catatan, daftar komik, harga, atau review buku di sini..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#0F111A] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#3DDC84] font-sans leading-relaxed resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3DDC84] hover:bg-[#32c974] active:scale-95 text-[#0F111A] font-mono font-bold text-xs shadow-sm shadow-[#3DDC84]/20 transition-all cursor-pointer"
                >
                  SIMPAN CATATAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: KONFIRMASI HAPUS CATATAN                         */}
      {/* ========================================================= */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white dark:bg-[#161925] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hapus Catatan Ini?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-mono">
                "{noteToDelete.title}"
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold shadow-xs cursor-pointer"
              >
                HAPUS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper renderer for Note Card in the list
  function renderNoteCard(note: NoteItem) {
    const colorStyle = COLOR_MAP[note.color || 'emerald'] || COLOR_MAP.emerald;
    const isCopied = copiedNoteId === note.id;

    return (
      <div
        key={note.id}
        onClick={() => handleNoteClick(note)}
        className={`group relative rounded-2xl p-4 border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between ${
          note.isPinned
            ? `${colorStyle.bg} ${colorStyle.border} shadow-xs`
            : 'bg-white dark:bg-[#161925] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div>
          {/* Card Top Row: Badges & Quick Action icons */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${colorStyle.badge}`}
              >
                {note.category}
              </span>

              {note.isPinned && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#3DDC84] bg-[#3DDC84]/15 px-1.5 py-0.5 rounded">
                  <Pin size={10} className="fill-[#3DDC84]" />
                  PIN
                </span>
              )}

              {note.isLocked && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded">
                  <Lock size={10} />
                  PRIVAT
                </span>
              )}
            </div>

            {/* Quick Action buttons */}
            <div
              className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => handleTogglePin(note.id, e)}
                title={note.isPinned ? 'Batal Pin' : 'Sematkan ke atas'}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#3DDC84] flex items-center justify-center transition-colors cursor-pointer"
              >
                <Pin size={13} className={note.isPinned ? 'fill-[#3DDC84] text-[#3DDC84]' : ''} />
              </button>

              <button
                type="button"
                onClick={(e) => handleCopyNote(note, e)}
                title="Salin isi catatan"
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                {isCopied ? <Check size={13} className="text-[#3DDC84]" /> : <Copy size={13} />}
              </button>

              <button
                type="button"
                onClick={(e) => handleDownloadNote(note, e)}
                title="Unduh sebagai file .txt"
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Download size={13} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNoteToDelete(note);
                }}
                title="Hapus catatan"
                className="w-7 h-7 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#3DDC84] transition-colors leading-snug flex items-center gap-1.5">
            {note.isLocked && <Lock size={13} className="text-purple-500 shrink-0" />}
            <span>{note.title}</span>
          </h3>

          {/* Content snippet or Locked Mask */}
          {note.isLocked ? (
            <div className="mt-2.5 p-3 rounded-xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-200/70 dark:border-purple-500/20 flex items-center gap-2 text-xs font-mono text-purple-700 dark:text-purple-300">
              <Lock size={14} className="shrink-0 text-purple-500" />
              <span className="line-clamp-2 leading-relaxed">
                Catatan Terkunci • Ketuk untuk memasukkan password/PIN & baca isi lengkap.
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-sans line-clamp-3 leading-relaxed whitespace-pre-line">
              {note.content}
            </p>
          )}
        </div>

        {/* Card Footer: Click prompt hint & date */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar size={11} />
            <span>
              {new Date(note.updatedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>

          <span className="text-emerald-600 dark:text-[#3DDC84] font-medium flex items-center gap-1 group-hover:underline">
            <Maximize2 size={10} />
            BACA FULL
          </span>
        </div>
      </div>
    );
  }
};
