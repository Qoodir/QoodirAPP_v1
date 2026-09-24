import { NoteItem } from '../types';

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-1',
    title: 'Wishlist Komik yang Harus Dibeli',
    content: `- One Piece Vol. 105 & 106 (Gramedia / Online)
- Jujutsu Kaisen Vol. 21 (Cover Gojo)
- Frieren: Beyond Journey's End Vol. 6 - 8
- Spy x Family Vol. 11

Tips: Cek promo tanggal kembar di marketplace untuk dapat diskon bundel!`,
    category: 'Wishlist',
    isPinned: true,
    color: 'emerald',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000 * 5
  },
  {
    id: 'note-2',
    title: 'Review: 20th Century Boys (Bind-up Edition)',
    content: `Karya masterpiece Naoki Urasawa!
Alur cerita maju-mundur antara masa kanak-kanak Kenji dkk tahun 1969 dan era modern 2000-an.
Misteri identitas "Friend" dieksekusi dengan sangat menegangkan.

Kelebihan versi bind-up (kanzenban):
- Kertas lebih tebal & halaman berwarna original disertakan.
- Format 2-in-1 lebih ringkas disimpan di rak buku.
Rating: 9.8 / 10`,
    category: 'Review',
    isPinned: true,
    color: 'blue',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000
  },
  {
    id: 'note-3',
    title: 'Catatan Rak & Penyimpanan Komik Fisik',
    content: `Panduan perawatan koleksi komik agar tidak menguning (foxing):
1. Hindari paparan sinar matahari langsung ke punggung buku.
2. Gunakan silica gel di dalam lemari kaca atau container box.
3. Beri plastik OPP/mika pelindung untuk komik langka atau out-of-print.
4. Jangan tumpuk horizontal terlalu tinggi agar jilidan tidak rusak.`,
    category: 'Komik',
    isPinned: false,
    color: 'amber',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    id: 'note-4',
    title: 'Catatan Anggaran & Kontak Rahasia Kolektor',
    content: `Rencana Anggaran & Keuangan Hobi:
- Batas maksimal pembelian komik: Rp 400.000 / bulan.
- Tabungan khusus artbook/figure: Rp 200.000 / bulan.

Kontak Penjual Komik Langka:
- Om Budi (Kolektor Pasar Senen): 0812-8899-7711
- Mas Reza (Importir Manga JP): reza_manga_jp@gmail.com

(Catatan ini diproteksi PIN privasi agar tidak sembarang dibuka orang lain)`,
    category: 'Umum',
    isPinned: false,
    isLocked: true,
    password: '1234',
    color: 'purple',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 3600000 * 2
  }
];
