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
};

export const books: Book[] = [
  {
    "id": "B-0006",
    "title": "тест 9",
    "authors": [
      "Пуп"
    ],
    "year": 2026,
    "publisher": "",
    "categories": [
      "Книжные издания"
    ],
    "category": "Книжные издания",
    "genres": [
      "Биографическая проза"
    ],
    "annotation": "",
    "rack": "1",
    "shelf": "5",
    "inventoryNumber": "B-0006",
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/books/B-0006.pdf",
    "published": true,
    "ocrUrl": ""
  },
  {
    "id": "B-0005",
    "title": "большая книга тест 8",
    "authors": [
      "Уа-уа"
    ],
    "year": 2026,
    "publisher": "Ау",
    "categories": [
      "Книжные издания"
    ],
    "category": "Книжные издания",
    "genres": [
      "Рассказы и новеллы"
    ],
    "annotation": "",
    "rack": "3",
    "shelf": "3",
    "inventoryNumber": "B-0005",
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/scanned-books/B-0005.pdf",
    "published": true,
    "ocrUrl": ""
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
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/books/B-0004.pdf",
    "published": true,
    "ocrUrl": ""
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
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/books/B-0003.pdf",
    "published": true,
    "ocrUrl": ""
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
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/books/B-0002.pdf",
    "published": true,
    "ocrUrl": ""
  }
];
