import { ComicItem } from '../types';

export interface AutocompleteComic {
  title: string;
  author: string;
  volumes: number;
  type?: 'reguler' | 'bindup';
  keywords: string[];
}

export const OFFLINE_AUTOCOMPLETE_DATABASE: AutocompleteComic[] = [
  {
    title: 'Akasha: Goodnight Punpun',
    author: 'Inio Asano',
    volumes: 13,
    type: 'reguler',
    keywords: ['akasha', 'goodnight punpun', 'oyasumi punpun', 'punpun', 'inio asano', 'seinen']
  },
  {
    title: 'One Piece',
    author: 'Eiichiro Oda',
    volumes: 108,
    type: 'reguler',
    keywords: ['one piece', 'op', 'luffy', 'strawhat', 'zoro', 'shonen']
  },
  {
    title: 'Naruto',
    author: 'Masashi Kishimoto',
    volumes: 72,
    type: 'reguler',
    keywords: ['naruto', 'shippuden', 'uzumaki', 'sasuke', 'ninja', 'shonen']
  },
  {
    title: 'Jujutsu Kaisen',
    author: 'Gege Akutami',
    volumes: 27,
    type: 'reguler',
    keywords: ['jujutsu kaisen', 'jjk', 'gojo', 'itadori', 'sukuna', 'shonen']
  },
  {
    title: "Frieren: Beyond Journey's End",
    author: 'Kanehito Yamada & Tsukasa Abe',
    volumes: 13,
    type: 'reguler',
    keywords: ['frieren', 'beyond journeys end', 'sousou no frieren', 'himmel', 'fern']
  },
  {
    title: 'Chainsaw Man',
    author: 'Tatsuki Fujimoto',
    volumes: 17,
    type: 'reguler',
    keywords: ['chainsaw man', 'csm', 'denji', 'makima', 'power', 'fujimoto']
  },
  {
    title: 'Bleach: 2-in-1 Edition',
    author: 'Tite Kubo',
    volumes: 37,
    type: 'bindup',
    keywords: ['bleach', 'ichigo', 'soul reaper', 'tite kubo', 'bindup', '2-in-1']
  },
  {
    title: 'Death Note: All-in-One Edition',
    author: 'Tsugumi Ohba & Takeshi Obata',
    volumes: 1,
    type: 'bindup',
    keywords: ['death note', 'light yagami', 'l', 'ryuk', 'all-in-one', 'bindup']
  },
  {
    title: 'Monster: The Perfect Edition',
    author: 'Naoki Urasawa',
    volumes: 9,
    type: 'bindup',
    keywords: ['monster', 'naoki urasawa', 'tenma', 'johan liebert', 'perfect edition', 'bindup']
  },
  {
    title: 'Vagabond',
    author: 'Takehiko Inoue',
    volumes: 37,
    type: 'reguler',
    keywords: ['vagabond', 'takehiko inoue', 'musashi', 'samurai']
  },
  {
    title: 'Slam Dunk',
    author: 'Takehiko Inoue',
    volumes: 31,
    type: 'reguler',
    keywords: ['slam dunk', 'sakuragi', 'shohoku', 'basketball']
  }
];

export const INITIAL_CATALOG: ComicItem[] = [
  {
    id: 201,
    title: 'Akasha: Goodnight Punpun',
    author: 'Inio Asano',
    totalVolumes: 13,
    type: 'reguler',
    mangaLinkFolder: 'Goodnight Punpun'
  },
  {
    id: 100,
    title: "Frieren: Beyond Journey's End",
    author: 'Kanehito Yamada & Tsukasa Abe',
    totalVolumes: 13,
    type: 'reguler',
    mangaLinkFolder: 'Frieren'
  },
  {
    id: 305,
    title: 'Monster: The Perfect Edition',
    author: 'Naoki Urasawa',
    totalVolumes: 9,
    type: 'bindup',
    mangaLinkFolder: 'Monster'
  }
];

export const INITIAL_OWNED_VOLUMES: Record<number, number[]> = {
  201: [1, 2, 3, 4, 5, 6, 7],
  100: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  305: [1, 2, 3]
};
