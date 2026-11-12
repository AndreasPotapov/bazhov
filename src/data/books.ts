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
  pdfUrl?: string; // <-- ДОБАВЛЕНО: ссылка на облако
  pdfFileName?: string;
  published?: boolean;
};


export const books: Book[] = [];