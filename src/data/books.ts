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
    "pdfUrl": "",
    "published": true
  },
  {
    "id": "B-0001",
    "title": "огромнейшееназваникнигиоднимсловом",
    "authors": [
      "автор авторович а если очень длинный автор вдруг такое бывает А. С."
    ],
    "year": 2026,
    "publisher": "москва",
    "category": "Драматургия",
    "genres": [],
    "annotation": "а если аннотация будет очень длинная и тяжелая что будет там показываться ",
    "rack": "2",
    "shelf": "1",
    "inventoryNumber": "B-0001",
    "pdfUrl": "https://storage.yandexcloud.net/bazhov-library-files/books/B-0001.pdf",
    "published": true
  }
];
