export type TocEntry = { title: string; page: number };

export type Book = {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  publisher?: string;
  categories?: string[];
  category?: string;
  genres?: string[];
  annotation?: string;
  shelf?: string;
  rack?: string;
  inventoryNumber?: string;
  pdfPath?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  published?: boolean;
  ocrUrl?: string;
  coverUrl?: string;
  processing?: boolean;
  toc?: TocEntry[];
};

export const books: Book[] = [
  {
    "id": "B-0004",
    "title": "Сочинения в трех томах. Том 3: Уральские были",
    "authors": [
      "Бажов П. П."
    ],
    "year": 2026,
    "publisher": "Правда, Москва",
    "categories": [
      "Проза"
    ],
    "category": "Проза",
    "genres": [
      "Альманахи и сборники",
      "Мифы и мифологические сюжеты",
      "Легенды и предания",
      "Повести",
      "Рассказы и новеллы"
    ],
    "annotation": "Собрание сочинений печатается по изданию: П. П. Бажов. Сочинения в трех томах. Изд-во «Правда». 1976\nИллюстрации художника\nИ. И. Пчелко",
    "rack": "1",
    "shelf": "1",
    "inventoryNumber": "B-0004",
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/scanned-books/B-0004.pdf",
    "published": true,
    "ocrUrl": "",
    "toc": []
  },
  {
    "id": "B-0003",
    "title": "Собрание сочинений в 3 томах. Том 2: Малахитовая шкатулка",
    "authors": [
      "Бажов П. П."
    ],
    "year": 1986,
    "publisher": "Москва",
    "categories": [
      "Проза"
    ],
    "category": "Проза",
    "genres": [
      "Альманахи и сборники",
      "Рассказы и новеллы",
      "Повести"
    ],
    "annotation": "Собрание сочинений печатается по изданию: П. П. Бажов. Сочинения в трех томах. Изд-во «Правда», 1976.",
    "rack": "2",
    "shelf": "7",
    "inventoryNumber": "B-0003",
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/scanned-books/B-0003.pdf",
    "published": true,
    "toc": []
  },
  {
    "id": "B-0002",
    "title": "Собрание сочинений в 3 томах. Том 1",
    "authors": [
      "П. П. Бажов"
    ],
    "year": 1986,
    "publisher": "Правда, Москва",
    "categories": [
      "Художественная литература"
    ],
    "category": "Художественная литература",
    "genres": [
      "Альманахи и сборники",
      "Рассказы и новеллы",
      "Сборники прозы",
      "Сказки и познавательные истории"
    ],
    "annotation": "Собрание сочинений печатается по изданию: П. П. Бажов. Сочинения в трех томах. Изд-во «Правда», 1976.",
    "rack": "2",
    "shelf": "1",
    "inventoryNumber": "B-0002",
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/scanned-books/B-0002.pdf",
    "published": true,
    "toc": []
  },
  {
    "id": "B-0005",
    "title": "На Урале",
    "authors": [
      "Сергей Васильев"
    ],
    "year": 1944,
    "publisher": "Детгиз, Москва",
    "categories": [
      "Книжные издания"
    ],
    "category": "Книжные издания",
    "genres": [
      "Рассказы и новеллы",
      "Стихотворения",
      "Поэзия"
    ],
    "annotation": "Собрание стихотворений С. Васильева. Рисунки В. Таубера. Государственное издательство детской литературы минпроса РСФСР. ",
    "rack": "1",
    "shelf": "3",
    "inventoryNumber": "B-0005",
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/scanned-books/B-0005.pdf",
    "published": true,
    "ocrUrl": "",
    "coverUrl": "https://storage.yandexcloud.net/bazhov-library-files/books/B-0005_cover.jpg",
    "processing": false,
    "toc": []
  }
];
