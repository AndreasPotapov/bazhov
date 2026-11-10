export type Book = {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  publisher?: string;
  category?: string;
  genres?: string[];  // ← теперь массив
  annotation?: string;
  shelf?: string;
  rack?: string;
  inventoryNumber?: string;
  pdfPath?: string;
  pdfFileName?: string;
  published?: boolean;
};

export const books: Book[] = [
  {
    id: "demo-001",
    title: "Тестовая запись: книга о сказах",
    authors: ["Автор для демонстрации"],
    year: 2020,
    publisher: "Тестовое издательство",
    category: "Художественная литература",
    genres: ["Сборники прозы", "Сказки"],
    annotation: "Демонстрационная карточка.",
    rack: "1",
    shelf: "2",
    inventoryNumber: "ДЕМО-001",
    pdfPath: "files/sample.pdf",
  },
  {
    id: "demo-002",
    title: "Тестовая запись: уральские истории",
    authors: ["Автор для демонстрации", "Соавтор"],
    year: 2018,
    publisher: "Пример издательства",
    category: "История",
    genres: ["Историческая проза", "Рассказы и новеллы"],
    rack: "2",
    shelf: "4",
  },
  {
    id: "demo-003",
    title: "Тестовая запись: собрание произведений",
    authors: ["Другой автор"],
    year: 2022,
    category: "Художественная литература",
    genres: ["Собрания сочинений и избранные произведения"],
    annotation: "Пример карточки с неполными данными.",
  },
  {
    id: "bazhov-001",
    title: "Малахитовая шкатулка",
    authors: ["Бажов П. П."],
    year: 1939,
    publisher: "Свердловское областное издательство",
    category: "Художественная литература",
    genres: ["Сказки", "Сборники прозы"],
    annotation: "Классический сборник уральских сказов.",
    rack: "3",
    shelf: "1",
    inventoryNumber: "БАЖ-1939-01",
  },
  {
    id: "bazhov-002",
    title: "Серебряное копытце",
    authors: ["Бажов П. П."],
    year: 1942,
    category: "Художественная литература",
    genres: ["Сказки", "Книги для младшего школьного возраста"],
    rack: "1",
    shelf: "5",
    inventoryNumber: "БАЖ-1942-02",
  },
  {
    id: "bio-001",
    title: "Бажов. Жизнь и творчество",
    authors: ["Скорино Л. И."],
    year: 1958,
    publisher: "Советский писатель",
    category: "Язык и литература",
    genres: ["Биографии писателей", "Литературоведение и критика"],
    rack: "4",
    shelf: "2",
    inventoryNumber: "ЛИТ-1958-05",
  },
  {
    id: "local-001",
    title: "Уральские самоцветы: история и легенды",
    authors: ["Иванов А. С.", "Петров В. Н."],
    year: 1985,
    publisher: "Уральский рабочий",
    category: "История",
    genres: ["Легенды и предания", "Краеведение"],
    rack: "5",
    shelf: "3",
    inventoryNumber: "КРАЕВ-1985-12",
  },
  {
    id: "poetry-001",
    title: "Уральские просторы",
    authors: ["Сидоров К. М."],
    year: 1972,
    category: "Художественная литература",
    genres: ["Стихотворения", "Сборники стихов"],
    rack: "2",
    shelf: "1",
  },
  {
    id: "modern-001",
    title: "Тайны Уральских гор (современный взгляд)",
    authors: ["Екатеринбургский клуб краеведов"],
    year: 2024,
    publisher: "Издательство УрФУ",
    category: "История",
    genres: ["Краеведение", "Сборники прозы"],
    rack: "5",
    shelf: "7",
    inventoryNumber: "КРАЕВ-2024-88",
  },
  {
    id: "draft-001",
    title: "Неизданные письма П. П. Бажова",
    authors: ["Бажов П. П."],
    year: 2026,
    category: "Язык и литература",
    genres: ["Биографии писателей"],
    annotation: "Черновики и личная переписка.",
    published: false,
  },
];