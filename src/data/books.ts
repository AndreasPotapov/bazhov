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
    "id": "B-0006",
    "title": "тест оглавления",
    "authors": [
      "Автор П. А."
    ],
    "year": 2026,
    "publisher": "Алетейя",
    "categories": [
      "Справочные издания"
    ],
    "category": "Справочные издания",
    "genres": [
      "Литературные энциклопедии"
    ],
    "annotation": "Исправленный размер аннотации, проверка, как выглядит на сайте",
    "rack": "1",
    "shelf": "1",
    "inventoryNumber": "B-0006",
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/books/B-0006.pdf",
    "published": true,
    "ocrUrl": "",
    "processing": true,
    "toc": [
      {
        "title": "Введение",
        "page": 3
      },
      {
        "title": "Глава 1",
        "page": 4
      },
      {
        "title": "Глава 2 ",
        "page": 33
      }
    ]
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
  },
  {
    "id": "B-0004",
    "title": "Сочинения в 3 томах. Том 3: Уральские были",
    "authors": [
      "Бажов П. П."
    ],
    "year": 1986,
    "publisher": "Правда, Москва",
    "categories": [
      "Проза"
    ],
    "category": "Проза",
    "genres": [
      "Альманахи и сборники",
      "Повести",
      "Сказки",
      "Сборники прозы",
      "Сказки и познавательные истории",
      "Рассказы и новеллы"
    ],
    "annotation": "Собрание сочинений печатается по изданию: \nП. П. Б а ж о в. Сочинения в трех томах. \nИзд-во «Правда». 1976*\nИллюстрации художника\nИ. И. Пчелко",
    "rack": "4",
    "shelf": "8",
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
    "publisher": "Правда, Москва",
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
    "ocrUrl": "",
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
    "ocrUrl": "",
    "toc": []
  }
];
