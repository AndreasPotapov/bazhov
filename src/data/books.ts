export type Book = {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  publisher?: string;
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
};

export const books: Book[] = [
  {
    "id": "B-0003",
    "title": "Собрание сочинений в 3 томах. Том 2: Малахитовая шкатулка",
    "authors": [
      "Бажов П. П."
    ],
    "year": 1986,
    "publisher": "Москва",
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
    "published": true
  },
  {
    "id": "B-0002",
    "title": "Собрание сочинений в 3 томах. Том 1",
    "authors": [
      "П. П. Бажов"
    ],
    "year": 1986,
    "publisher": "Правда, Москва",
    "category": "Художественная литература",
    "genres": [
      "Альманахи и сборники",
      "Рассказы и новеллы",
      "Сборники прозы",
      "Сказки и познавательные истории"
    ],
    "annotation": "Собрание сочинений печатается по изданию:\nП. П. Бажов. Сочинения в трех томах.\nИзд-во «Правда», 1976.",
    "rack": "2",
    "shelf": "1",
    "inventoryNumber": "B-0002",
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/books/B-0002.pdf",
    "published": true
  }
];
