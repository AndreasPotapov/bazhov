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
    "id": "B-0001",
    "title": "книга 1",
    "authors": [
      "автор авторович"
    ],
    "year": 2026,
    "publisher": "москва",
    "category": "Драматургия",
    "genres": [],
    "annotation": "",
    "rack": "2",
    "shelf": "1",
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/books/B-0001.pdf",
    "published": true
  }
];
