import { useEffect, useMemo, useState, type FormEvent } from "react";
import Papa from "papaparse";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { russian } from "multilingual-stemmer";
import { books as seedBooks } from "./data/books";
import type { Book } from "./data/books";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type CsvRow = Record<string, string>;

type ImportPreviewRow = {
  book: Book;
  errors: string[];
  warnings: string[];
};

type CategoryNode = {
  id: string;
  name: string;
  children?: CategoryNode[];
};

const STORAGE_KEY = "bazhov-library-books-v3";
const DEMO_ADMIN_PIN = "museum-demo";

// ---------- РУБРИКАТОР: КАТЕГОРИИ (ТЕМЫ) ----------
const CATEGORIES: CategoryNode[] = [
  {
    id: "fiction",
    name: "Художественная литература",
    children: [
      { id: "fiction-prose", name: "Проза" },
      { id: "fiction-poetry", name: "Поэзия" },
      { id: "fiction-drama", name: "Драматургия" },
      { id: "fiction-genres", name: "Литература по жанрам и темам" },
      { id: "fiction-folklore", name: "Устное народное творчество" },
      { id: "fiction-children", name: "Литература для детей и юношества" },
      { id: "fiction-world", name: "Литература народов мира" },
    ],
  },
  {
    id: "nonfiction",
    name: "Нехудожественная литература",
    children: [
      { id: "nonfiction-philosophy", name: "Философия и религия" },
      { id: "nonfiction-psychology", name: "Психология и саморазвитие" },
      { id: "nonfiction-society", name: "Общество и гуманитарные науки" },
      { id: "nonfiction-history", name: "История" },
      { id: "nonfiction-geography", name: "География и путешествия" },
      { id: "nonfiction-science", name: "Естественные науки" },
      { id: "nonfiction-tech", name: "Техника и технологии" },
      { id: "nonfiction-medicine", name: "Здоровье и медицина" },
      { id: "nonfiction-art", name: "Искусство и культура" },
      { id: "nonfiction-language", name: "Язык и литература" },
      { id: "nonfiction-home", name: "Дом и повседневная жизнь" },
      { id: "nonfiction-sport", name: "Спорт и досуг" },
      { id: "nonfiction-business", name: "Бизнес и профессии" },
    ],
  },
  { id: "reference", name: "Справочные издания" },
  { id: "education", name: "Учебная и методическая литература" },
  { id: "periodicals", name: "Периодические и продолжающиеся издания" },
  { id: "formats", name: "Издания по формату и доступности" },
];

// ---------- РУБРИКАТОР: ЖАНРЫ (ФОРМЫ) ----------
const GENRES: string[] = [
  "Альманахи и сборники",
  "Антологии поэзии",
  "Атласы и карты",
  "Баллады и сонеты",
  "Библиографические пособия",
  "Былины и эпос",
  "Военная проза",
  "Газеты",
  "Детективы и триллеры",
  "Детская проза и поэзия",
  "Историческая проза",
  "Книги для дошкольников",
  "Книги для младшего школьного возраста",
  "Книги для подростков",
  "Книги для юношества",
  "Комедии",
  "Легенды и предания",
  "Любовная проза",
  "Методические материалы",
  "Мифы и мифологические сюжеты",
  "Повести",
  "Поэмы",
  "Приключения",
  "Пьесы",
  "Рассказы и новеллы",
  "Романы",
  "Самоучители и курсы",
  "Сборники прозы",
  "Сборники стихов",
  "Сказки",
  "Сказки и познавательные истории",
  "Словари",
  "Собрания сочинений и избранные произведения",
  "Социальная и реалистическая проза",
  "Справочники",
  "Стихотворения",
  "Трагедии и драмы",
  "Ужасы и мистика",
  "Учебники и пособия",
  "Фантастика",
  "Фольклорные сборники",
  "Фэнтези",
  "Хронологии и календари",
  "Энциклопедии",
  "Эссе и литературные миниатюры",
  "Юмор и сатира",
];

// ---------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ КАТЕГОРИЙ ----------
function flattenCategories(nodes: CategoryNode[], prefix = ""): { id: string; name: string; label: string }[] {
  const result: { id: string; name: string; label: string }[] = [];
  for (const node of nodes) {
    const label = prefix ? `${prefix} → ${node.name}` : node.name;
    result.push({ id: node.id, name: node.name, label });
    if (node.children) {
      result.push(...flattenCategories(node.children, label));
    }
  }
  return result;
}

function findCategoryById(id: string): CategoryNode | null {
  for (const node of CATEGORIES) {
    if (node.id === id) return node;
    if (node.children) {
      const found = node.children.find((c) => c.id === id);
      if (found) return found;
    }
  }
  return null;
}

function getCategoryNamesWithChildren(id: string): string[] {
  const node = findCategoryById(id);
  if (!node) return [];
  const names = [node.name];
  if (node.children) {
    node.children.forEach((child) => {
      names.push(...getCategoryNamesWithChildren(child.id));
    });
  }
  return names;
}

function getCategoryName(id: string): string {
  const node = findCategoryById(id);
  return node ? node.name : id;
}

const emptyBook: Book = {
  id: "",
  title: "",
  authors: [],
  year: undefined,
  publisher: "",
  category: "",
  genres: [],
  annotation: "",
  rack: "",
  shelf: "",
  inventoryNumber: "",
  pdfPath: "",
  published: false,
};

function normalizeBook(value: Partial<Book>): Book {
  const authors = Array.isArray(value.authors)
    ? value.authors.map((a) => String(a).trim()).filter(Boolean)
    : String(value.authors ?? "")
        .split(/[|;]/)
        .map((a) => a.trim())
        .filter(Boolean);

  const year =
    typeof value.year === "number"
      ? value.year
      : value.year && /^\d{1,4}$/.test(String(value.year))
        ? Number(value.year)
        : undefined;

  const genres = Array.isArray(value.genres)
    ? value.genres.map(String).filter(Boolean)
    : value.genre
      ? [String(value.genre)]
      : [];

  return {
    id: String(value.id ?? "").trim(),
    title: String(value.title ?? "").trim(),
    authors,
    ...(year !== undefined ? { year } : {}),
    publisher: String(value.publisher ?? "").trim(),
    category: String(value.category ?? "").trim(),
    genres,
    annotation: String(value.annotation ?? "").trim(),
    rack: String(value.rack ?? "").trim(),
    shelf: String(value.shelf ?? "").trim(),
    inventoryNumber: String(value.inventoryNumber ?? "").trim(),
    pdfPath: String(value.pdfPath ?? "").trim(),
    pdfFileName: String(value.pdfFileName ?? "").trim(),
    published: value.published !== false,
  };
}

function readInitialBooks(): Book[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.map((item) => normalizeBook(item));
    }
  } catch {
    // повреждённые данные — используем исходный набор
  }
  return seedBooks.map((book) => normalizeBook(book));
}

// ---------- МОРФОЛОГИЯ ----------
function stemText(text: string): string[] {
  const normalized = text.toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
  return normalized
    .split(/[^a-zа-я0-9]+/i)
    .filter(Boolean)
    .map((word) => russian(word));
}

function bookStems(book: Book): string[] {
  const text = [
    book.title,
    ...book.authors,
    book.publisher,
    book.category,
    ...(book.genres || []),
    book.annotation,
    book.inventoryNumber,
    book.year?.toString(),
  ]
    .filter(Boolean)
    .join(" ");

  return stemText(text);
}

function matchesSearch(book: Book, query: string): boolean {
  const queryStems = stemText(query);
  if (queryStems.length === 0) return true;

  const bookStemList = bookStems(book);
  return queryStems.every((stem) => bookStemList.includes(stem));
}

// ---------- CSV ----------
function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

const CSV_FIELDS: Record<string, keyof Book> = {
  id: "id", идентификатор: "id", код: "id",
  title: "title", название: "title",
  authors: "authors", автор: "authors", авторы: "authors",
  year: "year", год: "year",
  publisher: "publisher", издательство: "publisher",
  category: "category", категория: "category",
  genres: "genres", genre: "genres", жанр: "genres", жанры: "genres",
  annotation: "annotation", аннотация: "annotation",
  rack: "rack", стеллаж: "rack",
  shelf: "shelf", полка: "shelf",
  inventorynumber: "inventoryNumber", инвентарныйномер: "inventoryNumber",
  pdfpath: "pdfPath", pdf: "pdfPath", файл: "pdfPath", путькpdf: "pdfPath",
};

function rowToBook(row: CsvRow): Book {
  const result: Partial<Book> = { ...emptyBook, genres: [] };

  for (const [header, value] of Object.entries(row)) {
    const field = CSV_FIELDS[normalizeHeader(header)];
    if (!field) continue;

    if (field === "authors") {
      result.authors = String(value ?? "").split(/[|;]/).map((a) => a.trim()).filter(Boolean);
    } else if (field === "year") {
      const num = Number(String(value ?? "").trim());
      if (Number.isFinite(num)) result.year = num;
    } else if (field === "genres") {
      result.genres = String(value ?? "").split(/[|;]/).map((g) => g.trim()).filter(Boolean);
    } else {
      (result as Record<string, unknown>)[field] = String(value ?? "").trim();
    }
  }

  return normalizeBook(result);
}

// ---------- PDF-ОБЛОЖКА ----------
const coverCache = new Map<string, string>();

function PdfCover({ src, alt }: { src: string; alt: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(() => coverCache.get(src) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (dataUrl) return;
    let cancelled = false;

    (async () => {
      try {
        const resolved = src.startsWith("http") || src.startsWith("blob:") || src.startsWith("/")
            ? src
            : `${import.meta.env.BASE_URL}${src}`;

        const pdf = await pdfjsLib.getDocument({
          url: resolved,
          wasmUrl: `${import.meta.env.BASE_URL}pdfjs/wasm/`,
        }).promise;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context недоступен");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        const data = canvas.toDataURL("image/jpeg", 0.85);
        coverCache.set(src, data);

        if (!cancelled) setDataUrl(data);
      } catch (e) {
        console.error("[PdfCover] Ошибка:", e);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => { cancelled = true; };
  }, [src, dataUrl]);

  return (
    <div className="cover-wrap">
      {dataUrl ? (
        <img className="cover-image" src={dataUrl} alt={alt} />
      ) : (
        <span className="cover-placeholder" style={{ color: failed ? "#a12f2f" : "#62675f", fontWeight: failed ? 600 : 400 }}>
          {failed ? "Не удалось загрузить обложку" : "Загрузка обложки…"}
        </span>
      )}
    </div>
  );
}

export default function App() {
  const [books, setBooks] = useState<Book[]>(readInitialBooks);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Состояние фильтров
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  
  // Состояние выпадающих списков
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [adminGenreDropdownOpen, setAdminGenreDropdownOpen] = useState(false);

  const [admin, setAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [importRows, setImportRows] = useState<ImportPreviewRow[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch {
      setImportMessage("Не удалось сохранить данные в localStorage. Возможно, хранилище браузера заполнено.");
    }
  }, [books]);

  useEffect(() => {
    return () => {
      Object.values(pdfUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pdfUrls]);

  useEffect(() => {
    setVisibleCount(5);
  }, [query, selectedCategory, selectedGenres, yearRange]);

  const filterableBooks = useMemo(
    () => books.filter((book) => admin || book.published !== false),
    [books, admin],
  );

  const yearBounds = useMemo(() => {
    const years = filterableBooks.map((book) => book.year).filter((year): year is number => typeof year === "number");
    if (years.length === 0) return null;
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [filterableBooks]);

  const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedGenres.length > 0 ? 1 : 0) + (yearRange ? 1 : 0);

  function toggleGenre(genre: string) {
    setSelectedGenres((current) =>
      current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre],
    );
  }

  function toggleCategoryExpand(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const visibleBooks = useMemo(() => {
    return books.filter((book) => {
      if (!admin && book.published === false) return false;

      if (selectedCategory) {
        const selectedNames = getCategoryNamesWithChildren(selectedCategory);
        if (!selectedNames.includes(book.category || "")) {
          return false;
        }
      }

      if (selectedGenres.length > 0) {
        const bookGenres = book.genres || [];
        const hasMatch = selectedGenres.some((g) => bookGenres.includes(g));
        if (!hasMatch) return false;
      }

      if (yearRange) {
        if (typeof book.year !== "number" || book.year < yearRange[0] || book.year > yearRange[1]) {
          return false;
        }
      }

      return matchesSearch(book, query);
    });
  }, [books, admin, selectedCategory, selectedGenres, yearRange, query]);

  function openAdmin() {
    if (admin) {
      setAdmin(false);
      setEditingBook(null);
      return;
    }
    setPin("");
    setPinError("");
  }

  function submitPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin === DEMO_ADMIN_PIN) {
      setAdmin(true);
      setPinError("");
    } else {
      setPinError("Неверный демонстрационный PIN.");
    }
  }

  function saveBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBook) return;

    const book = normalizeBook(editingBook);
    if (!book.id || !book.title) return;

    setBooks((current) => {
      const exists = current.some((item) => item.id === book.id);
      if (exists) {
        return current.map((item) => (item.id === book.id ? book : item));
      }
      return [book, ...current];
    });
    setEditingBook(null);
  }

  function deleteBook(id: string) {
    if (!window.confirm("Удалить эту карточку?")) return;
    setBooks((current) => current.filter((book) => book.id !== id));
    if (selectedBook?.id === id) setSelectedBook(null);
  }

  function togglePublished(id: string) {
    setBooks((current) =>
      current.map((book) => (book.id === id ? { ...book, published: book.published === false } : book)),
    );
  }

  function attachPdf(file: File | undefined) {
    if (!file || !editingBook) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setImportMessage("Можно прикрепить только PDF-файл.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPdfUrls((current) => {
      const oldUrl = current[editingBook.id];
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      return { ...current, [editingBook.id || "new"]: url };
    });
    setEditingBook({ ...editingBook, pdfPath: file.name, pdfFileName: file.name });
    setImportMessage("PDF доступен в этой вкладке. Файл не загружается в облако и не сохраняется в localStorage.");
  }

  function parseCsv(file: File | undefined) {
    if (!file) return;
    setImportMessage("");
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length) setImportMessage(`CSV прочитан с предупреждениями: ${errors.length}.`);
        const existingIds = new Set(books.map((book) => book.id));
        const seenIds = new Set<string>();

        const preview = data.map((row) => {
          const book = rowToBook(row);
          const rowErrors: string[] = [];
          const warnings: string[] = [];

          if (!book.id) rowErrors.push("Не заполнен ID.");
          if (!book.title) rowErrors.push("Не заполнено название.");
          if (book.id && existingIds.has(book.id)) {
            warnings.push("Такой ID уже есть в каталоге.");
          } else if (book.id && seenIds.has(book.id)) {
            warnings.push("Такой ID повторяется в этом CSV.");
          }
          if (book.id) seenIds.add(book.id);
          return { book, errors: rowErrors, warnings };
        });

        setImportRows(preview);
        setImportMessage(`Подготовлено строк для проверки: ${preview.length}.`);
      },
      error: () => setImportMessage("Не удалось прочитать CSV-файл."),
    });
  }

  function importValidRows() {
    const validRows = importRows.filter((row) => row.errors.length === 0 && row.warnings.length === 0);
    if (!validRows.length) {
      setImportMessage("Нет строк без ошибок и предупреждений для импорта.");
      return;
    }
    setBooks((current) => [...validRows.map((row) => row.book), ...current]);
    setImportMessage(`Импортировано карточек: ${validRows.length}.`);
    setImportRows([]);
  }

  function pdfHref(book: Book): string {
    return pdfUrls[book.id] ?? pdfUrls["new"] ?? book.pdfPath ?? "";
  }

  // ---------- РЕНДЕР ДЕРЕВА КАТЕГОРИЙ ----------
  function renderCategoryNode(node: CategoryNode, depth = 0) {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedCategory === node.id;
    const isExpanded = expandedCategoryIds.includes(node.id);

    return (
      <div key={node.id} style={{ marginLeft: depth * 12 }}>
        <div className="category-row">
          {hasChildren ? (
            <button
              type="button"
              className="expand-btn"
              onClick={(e) => toggleCategoryExpand(node.id, e)}
              aria-label={isExpanded ? "Свернуть" : "Развернуть"}
            >
              {isExpanded ? "▼" : "►"}
            </button>
          ) : (
            <span className="expand-spacer" />
          )}
          <label className="rubric-option" style={{ flex: 1, cursor: "pointer" }}>
            <input
              type="radio"
              name="category-filter"
              checked={isSelected}
              onChange={() => {
                setSelectedCategory(isSelected ? "" : node.id);
                setCategoryDropdownOpen(false);
              }}
            />
            <span>{node.name}</span>
          </label>
        </div>
        {hasChildren && isExpanded && (
          <div className="rubric-children">
            {node.children!.map((child) => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const flatCategories = useMemo(() => flattenCategories(CATEGORIES), []);

  return (
    <main className="app">
      <style>{`
        @font-face {
          font-family: "Wremena";
          src: url("/fonts/Wremena Bold.otf") format("opentype");
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: "Moniqa";
          src: url("/fonts/Moniqa-SemBdCondHeading.otf") format("opentype");
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: "Cochin";
          src: url("/fonts/Cochin.ttc");
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }

        :root {
          --color-green: #31563f;
          --color-green-dark: #254531;
          --color-green-light: #f0f3ef;
          --color-bg: #f6f5f1;
          --color-text: #252b25;
          --color-muted: #62675f;
          --color-border: #e6e3da;
          --color-danger: #9d3535;
          --color-warning: #8a5b00;
          --color-error: #a12f2f;
          --font-display: "Wremena", Georgia, "Times New Roman", serif;
          --font-body: "Cochin", Georgia, system-ui, -apple-system, serif;
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: var(--color-bg);
          color: var(--color-text);
          font-family: var(--font-body);
          font-size: 16px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        button, input, select, textarea { font: inherit; }
        button { cursor: pointer; }

        .app {
          max-width: 1120px;
          margin: 0 auto;
          padding: 32px 24px 80px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          padding-bottom: 20px;
          margin-bottom: 40px;
          border-bottom: 2px solid var(--color-green);
        }

        .brand h1 {
          margin: 0 0 6px;
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--color-green);
          line-height: 1.15;
        }

        .brand .muted { font-size: 0.95rem; }
        .muted { color: var(--color-muted); }

        .admin-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .admin-label {
          color: var(--color-green);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .panel {
          padding: 24px;
          margin: 0 0 32px;
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: 4px;
        }

        .panel strong {
          display: block;
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--color-green);
        }

        .panel p { margin: 0; }

        .panel h3 {
          margin: 16px 0 12px;
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-green);
        }

        .panel .topbar {
          padding-bottom: 14px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--color-border);
        }

        .search-area { margin-bottom: 40px; }

        .search-line {
          display: flex;
          gap: 12px;
          align-items: stretch;
          flex-wrap: wrap;
        }

        .search-input {
          flex: 1 1 320px;
          min-height: 56px;
          padding: 0 20px;
          border: 1.5px solid var(--color-border);
          border-radius: 6px;
          background: #fff;
          font-size: 1rem;
          font-family: var(--font-body);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .search-input:focus {
          border-color: var(--color-green);
          box-shadow: 0 0 0 3px rgb(49 86 63 / 10%);
        }

        .filters-button {
          padding: 0 22px;
          min-height: 56px;
          border: 1.5px solid var(--color-green);
          border-radius: 6px;
          background: transparent;
          color: var(--color-green);
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 0.95rem;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }

        .filters-button:hover,
        .filters-button.active {
          background: var(--color-green);
          color: #fff;
        }

        .filters-panel {
          margin-top: 16px;
          padding: 24px;
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          display: grid;
          gap: 24px;
        }

        .filter-section h3 {
          margin: 0 0 12px;
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-green);
        }

        /* Стили для выпадающих списков (категории и жанры) */
        .category-dropdown {
          position: relative;
        }

        .category-dropdown-btn {
          width: 100%;
          text-align: left;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          color: var(--color-text);
          border: 1.5px solid var(--color-border);
          padding: 10px 14px;
          border-radius: 6px;
          font-weight: 400;
          font-size: 0.95rem;
        }

        .category-dropdown-btn:hover {
          background: #fff;
          border-color: var(--color-green);
        }

        .category-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 10;
          background: #fff;
          border: 1.5px solid var(--color-border);
          border-radius: 6px;
          max-height: 300px;
          overflow-y: auto;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .genres-dropdown-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .category-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 2px 0;
        }

        .expand-btn {
          background: transparent;
          border: none;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-muted);
          font-size: 10px;
          cursor: pointer;
          border-radius: 4px;
        }

        .expand-btn:hover {
          background: var(--color-bg);
          color: var(--color-green);
        }

        .expand-spacer {
          width: 24px;
        }

        .rubric-option {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
        }

        .rubric-option input {
          width: auto;
          margin: 0;
          accent-color: var(--color-green);
        }

        .rubric-children {
          display: grid;
          gap: 4px;
          margin-top: 4px;
        }

        .year-values {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 0.9rem;
          color: var(--color-muted);
          font-variant-numeric: tabular-nums;
        }

        .year-slider-wrap { padding: 8px 4px; }

        .rc-slider-rail {
          background: var(--color-border) !important;
          height: 4px;
        }

        .rc-slider-track {
          background: var(--color-green) !important;
          height: 4px;
        }

        .rc-slider-handle {
          width: 18px !important;
          height: 18px !important;
          margin-top: -7px !important;
          border: 2px solid var(--color-green) !important;
          background: #fff !important;
          opacity: 1 !important;
        }

        .rc-slider-handle:hover,
        .rc-slider-handle:focus,
        .rc-slider-handle-dragging {
          border-color: var(--color-green-dark) !important;
          box-shadow: 0 0 0 4px rgb(49 86 63 / 15%) !important;
        }

        .filter-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          padding-top: 12px;
          border-top: 1px solid var(--color-border);
        }

        button {
          border: 0;
          border-radius: 6px;
          padding: 10px 18px;
          background: var(--color-green);
          color: #fff;
          font-weight: 500;
          font-size: 0.95rem;
          transition: background 0.15s;
        }

        button:hover { background: var(--color-green-dark); }

        button.secondary {
          color: var(--color-green);
          background: transparent;
          border: 1px solid var(--color-green);
        }

        button.secondary:hover {
          background: var(--color-green);
          color: #fff;
        }

        button.danger {
          background: var(--color-danger);
        }

        button.danger:hover { background: #7f2929; }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ---------- Catalog & Horizontal Cards ---------- */
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .book-card {
          padding: 24px;
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 12px 28px;
          align-items: start;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .book-card:hover {
          box-shadow: 0 6px 24px rgb(0 0 0 / 6%);
          transform: translateY(-2px);
        }

        .tag {
          grid-column: 2;
          grid-row: 1;
          justify-self: start;
          margin-bottom: 0;
          display: inline-block;
          padding: 3px 10px;
          border-radius: 2px;
          background: var(--color-bg);
          color: var(--color-muted);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .cover-wrap {
          grid-column: 1;
          grid-row: 2;
          width: 140px;
          aspect-ratio: 3 / 4;
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgb(0 0 0 / 4%);
        }

        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .cover-placeholder {
          color: var(--color-muted);
          font-size: 0.8rem;
          text-align: center;
          padding: 8px;
          line-height: 1.4;
        }

        .book-info {
          grid-column: 2;
          grid-row: 2;
          min-width: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 32px;
          align-content: start;
        }

        .book-info > h2,
        .book-info > .book-annotation,
        .book-info > .card-actions {
          grid-column: 1 / -1;
        }

        .book-info > h2 {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 1.25;
          color: var(--color-green);
        }

        .book-info p {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--color-text);
        }

        .book-info p strong {
          display: block;
          font-weight: 600;
          color: var(--color-muted);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .book-info .book-annotation {
          margin-top: 8px;
          color: var(--color-muted);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }

        .card-actions a {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          color: var(--color-green);
          border: 1px solid var(--color-green);
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
        }

        .card-actions a:hover {
          background: var(--color-green);
          color: #fff;
        }

        .load-more-container {
          display: flex;
          justify-content: center;
          margin-top: 32px;
          margin-bottom: 16px;
        }

        .load-more-container button {
          padding: 12px 32px;
          font-size: 1rem;
          min-width: 200px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 12px;
        }

        .field { display: grid; gap: 6px; }
        .field.full { grid-column: 1 / -1; }
        .field span { font-size: 0.9rem; color: var(--color-muted); }

        input, select, textarea {
          width: 100%;
          border: 1.5px solid var(--color-border);
          border-radius: 6px;
          padding: 10px 14px;
          background: #fff;
          font-family: var(--font-body);
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        input:focus, select:focus, textarea:focus {
          border-color: var(--color-green);
          box-shadow: 0 0 0 3px rgb(49 86 63 / 10%);
        }

        input[type="checkbox"] { width: auto; accent-color: var(--color-green); }
        textarea { min-height: 100px; resize: vertical; }

        .controls {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .preview { overflow-x: auto; margin-top: 16px; }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 650px;
          font-size: 0.9rem;
        }

        th, td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid var(--color-border);
          vertical-align: top;
        }

        th {
          font-weight: 600;
          color: var(--color-muted);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: var(--color-bg);
        }

        .error { color: var(--color-error); font-size: 0.9rem; }
        .warning { color: var(--color-warning); font-size: 0.9rem; }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 5;
          display: grid;
          place-items: center;
          padding: 16px;
          background: rgb(0 0 0 / 45%);
          backdrop-filter: blur(2px);
        }

        .modal {
          width: min(640px, 100%);
          max-height: 90vh;
          overflow: auto;
          padding: 32px;
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          box-shadow: 0 20px 60px rgb(0 0 0 / 20%);
        }

        .modal .topbar {
          padding-bottom: 14px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .modal h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-green);
        }

        .modal p { margin: 0 0 10px; font-size: 0.95rem; line-height: 1.55; }
        .modal p strong {
          font-weight: 700;
          color: var(--color-muted);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-right: 6px;
        }

        .modal a {
          color: var(--color-green);
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1px solid var(--color-green);
        }

        .notice {
          margin: 16px 0;
          padding: 12px 16px;
          background: var(--color-bg);
          border-left: 3px solid var(--color-green);
          border-radius: 2px;
          color: var(--color-muted);
          font-size: 0.9rem;
        }

        .admin-footer {
          margin-top: 80px;
          padding-top: 32px;
          border-top: 1px solid var(--color-border);
        }

        .admin-footer h3 {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-green);
        }

        .admin-footer code {
          padding: 2px 6px;
          background: var(--color-bg);
          border-radius: 3px;
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 0.85em;
        }

        @media (max-width: 700px) {
          .app { padding: 20px 16px 60px; }
          .topbar { margin-bottom: 24px; padding-bottom: 16px; }
          
          .book-card { grid-template-columns: 1fr; gap: 16px; }
          .tag { grid-column: 1; grid-row: auto; }
          .cover-wrap { grid-column: 1; grid-row: auto; justify-self: center; width: 140px; }
          .book-info { grid-column: 1; grid-row: auto; width: 100%; }

          .form-grid { grid-template-columns: 1fr; }
          .field.full { grid-column: auto; }
          .search-line { flex-direction: column; align-items: stretch; }
          .modal { padding: 24px; }
          .filters-panel { padding: 20px; }
        }
      `}</style>

      <header className="topbar">
        <div className="brand">
          <h1>Электронный кабинет П. П. Бажова</h1>
          <div className="muted">Книжная коллекция дома-музея П. П. Бажова</div>
        </div>
        <div className="admin-actions">
          {admin && <span className="admin-label">Режим сотрудника</span>}
          {admin && (
            <button className="secondary" onClick={openAdmin}>
              Выйти из админ-панели
            </button>
          )}
        </div>
      </header>

      {!admin && (
        <section className="panel">
          <strong>Каталог для посетителей</strong>
          <p className="muted">
            Используйте поиск по библиографическим данным или откройте фильтры,
            чтобы уточнить категорию, жанр и год издания.
          </p>
        </section>
      )}

      {admin && (
        <section className="panel">
          <div className="topbar">
            <div>
              <strong>Управление каталогом</strong>
              <p className="muted">Данные прототипа сохраняются в этом браузере.</p>
            </div>
            <button onClick={() => setEditingBook({ ...emptyBook })}>
              Добавить книгу
            </button>
          </div>

          <div className="admin-actions">
            <label>
              <span className="muted">Импорт CSV: </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => parseCsv(event.target.files?.[0])}
              />
            </label>
            <button
              className="secondary"
              onClick={() => {
                setImportRows([]);
                setImportMessage("");
              }}
            >
              Очистить предпросмотр
            </button>
          </div>

          <p className="notice">
            CSV импортирует только карточки. Загрузка PDF в облачное хранилище
            требует серверной части.
          </p>

          {importMessage && <p className="notice">{importMessage}</p>}

          {importRows.length > 0 && (
            <div className="preview">
              <h3>Предпросмотр импорта</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Год</th>
                    <th>Результат проверки</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((row, index) => (
                    <tr key={`${row.book.id}-${index}`}>
                      <td>{row.book.id || "—"}</td>
                      <td>{row.book.title || "—"}</td>
                      <td>{row.book.year ?? "—"}</td>
                      <td>
                        {row.errors.map((item) => (
                          <div className="error" key={item}>{item}</div>
                        ))}
                        {row.warnings.map((item) => (
                          <div className="warning" key={item}>{item}</div>
                        ))}
                        {!row.errors.length && !row.warnings.length && "Готово к импорту"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                Строки с ошибками и предупреждениями пропускаются; дубли ID не
                перезаписывают существующие карточки.
              </p>
              <button onClick={importValidRows}>
                Импортировать корректные строки
              </button>
            </div>
          )}
        </section>
      )}

      <section className="search-area" aria-label="Поиск и фильтры">
        <div className="search-line">
          <input
            className="search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию, автору, году, издательству, жанру…"
            aria-label="Поиск по каталогу"
          />
          <button
            type="button"
            className={`filters-button ${activeFilterCount > 0 ? "active" : ""}`}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Фильтры
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            <span aria-hidden="true" style={{ marginLeft: 6 }}>
              {filtersOpen ? "▲" : "▼"}
            </span>
          </button>
        </div>

        {filtersOpen && (
          <div className="filters-panel">
            <div className="filter-section">
              <h3>Категория</h3>
              <div className="category-dropdown">
                <button
                  type="button"
                  className="category-dropdown-btn"
                  onClick={() => setCategoryDropdownOpen((open) => !open)}
                >
                  {selectedCategory ? getCategoryName(selectedCategory) : "Все категории"}
                  <span aria-hidden="true">{categoryDropdownOpen ? "▲" : "▼"}</span>
                </button>
                {categoryDropdownOpen && (
                  <div className="category-dropdown-menu">
                    <label className="rubric-option" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--color-border)" }}>
                      <input
                        type="radio"
                        name="category-filter"
                        checked={selectedCategory === ""}
                        onChange={() => {
                          setSelectedCategory("");
                          setCategoryDropdownOpen(false);
                        }}
                      />
                      <span>Все категории</span>
                    </label>
                    {CATEGORIES.map((node) => renderCategoryNode(node))}
                  </div>
                )}
              </div>
            </div>

            <div className="filter-section">
              <h3>Жанры</h3>
              <div className="category-dropdown">
                <button
                  type="button"
                  className="category-dropdown-btn"
                  onClick={() => setGenreDropdownOpen((open) => !open)}
                >
                  {selectedGenres.length > 0 ? `Выбрано жанров: ${selectedGenres.length}` : "Все жанры"}
                  <span aria-hidden="true">{genreDropdownOpen ? "▲" : "▼"}</span>
                </button>
                {genreDropdownOpen && (
                  <div className="category-dropdown-menu">
                    <div className="genres-dropdown-list">
                      {GENRES.map((genre) => (
                        <label key={genre} className="rubric-option" style={{ cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedGenres.includes(genre)}
                            onChange={() => toggleGenre(genre)}
                          />
                          <span>{genre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {yearBounds && (
              <div className="filter-section">
                <h3>Год издания</h3>
                <div className="year-values">
                  <span>От: {yearRange?.[0] ?? yearBounds.min}</span>
                  <span>До: {yearRange?.[1] ?? yearBounds.max}</span>
                </div>
                <div className="year-slider-wrap">
                  <Slider
                    range
                    min={yearBounds.min}
                    max={yearBounds.max}
                    value={yearRange ?? [yearBounds.min, yearBounds.max]}
                    onChange={(value) => {
                      if (Array.isArray(value) && value.length === 2) {
                        setYearRange([value[0], value[1]]);
                      }
                    }}
                    allowCross={false}
                  />
                </div>
                <small className="muted">
                  Доступный диапазон: {yearBounds.min}–{yearBounds.max}
                </small>
              </div>
            )}

            <div className="filter-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setSelectedCategory("");
                  setSelectedGenres([]);
                  setYearRange(null);
                }}
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="muted">
        Найдено книг: {visibleBooks.length}
        {admin ? ` · Всего в каталоге: ${books.length}` : ""}
      </p>

      {visibleBooks.length === 0 ? (
        <section className="panel">По вашему запросу ничего не найдено.</section>
      ) : (
        <>
          <section className="grid">
            {visibleBooks.slice(0, visibleCount).map((book) => (
              <article className="book-card" key={book.id}>
                <span className="tag">{book.category || "Без категории"}</span>
                
                {book.pdfPath && (
                  <PdfCover
                    src={pdfHref(book)}
                    alt={`Обложка книги «${book.title}»`}
                  />
                )}

                <div className="book-info">
                  <h2>{book.title}</h2>

                  {book.authors.length > 0 && (
                    <p><strong>Автор</strong>{book.authors.join(", ")}</p>
                  )}
                  
                  {book.year && (
                    <p><strong>Год издания</strong>{book.year}</p>
                  )}
                  
                  {book.publisher && (
                    <p><strong>Издательство</strong>{book.publisher}</p>
                  )}
                  
                  {book.genres && book.genres.length > 0 && (
                    <p><strong>Жанры</strong>{book.genres.join(", ")}</p>
                  )}
                  
                  {(book.rack || book.shelf) && (
                    <p><strong>Место хранения</strong>Шкаф № {book.rack || "—"}, полка № {book.shelf || "—"}</p>
                  )}
                  
                  {book.inventoryNumber && (
                    <p><strong>Инвентарный номер</strong>{book.inventoryNumber}</p>
                  )}

                  {book.annotation && (
                    <p className="book-annotation">{book.annotation}</p>
                  )}
                  
                  {admin && (
                    <p className="muted" style={{ fontSize: "0.85rem" }}>
                      ID: {book.id} · {book.published === false ? "Не опубликована" : "Опубликована"}
                    </p>
                  )}

                  <div className="card-actions">
                    <button className="secondary" onClick={() => setSelectedBook(book)}>
                      Подробнее
                    </button>
                    
                    {book.pdfPath && (
                      <a
                        href={pdfHref(book)}
                        target="_blank"
                        rel="noreferrer"
                        download={book.pdfPath.split("/").pop()}
                      >
                        Скачать PDF
                      </a>
                    )}
                    
                    {admin && (
                      <>
                        <button className="secondary" onClick={() => setEditingBook({ ...book })}>
                          Изменить
                        </button>
                        <button className="secondary" onClick={() => togglePublished(book.id)}>
                          {book.published === false ? "Опубликовать" : "Снять с публикации"}
                        </button>
                        <button className="danger" onClick={() => deleteBook(book.id)}>
                          Удалить
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>

          {visibleCount < visibleBooks.length && (
            <div className="load-more-container">
              <button type="button" className="secondary" onClick={() => setVisibleCount((prev) => prev + 10)}>
                Показать еще
              </button>
            </div>
          )}
        </>
      )}

      {editingBook && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal" onSubmit={saveBook}>
            <div className="topbar">
              <h2>
                {books.some((book) => book.id === editingBook.id)
                  ? "Редактировать карточку"
                  : "Новая карточка"}
              </h2>
              <button type="button" className="secondary" onClick={() => setEditingBook(null)}>
                Закрыть
              </button>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>ID *</span>
                <input
                  value={editingBook.id}
                  onChange={(e) => setEditingBook({ ...editingBook, id: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Название *</span>
                <input
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Авторы (через запятую)</span>
                <input
                  value={editingBook.authors.join(", ")}
                  onChange={(e) => setEditingBook({ ...editingBook, authors: e.target.value.split(",") })}
                />
              </label>
              <label className="field">
                <span>Год</span>
                <input
                  type="number"
                  value={editingBook.year ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingBook({ ...editingBook, year: val ? Number(val) : undefined });
                  }}
                />
              </label>
              <label className="field">
                <span>Издательство</span>
                <input
                  value={editingBook.publisher ?? ""}
                  onChange={(e) => setEditingBook({ ...editingBook, publisher: e.target.value })}
                />
              </label>
              
              <label className="field">
                <span>Категория (Тема)</span>
                <select
                  value={editingBook.category ?? ""}
                  onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
                >
                  <option value="">— Не выбрана —</option>
                  {flatCategories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field full">
                <span>Жанры (Формы)</span>
                <div className="category-dropdown">
                  <button
                    type="button"
                    className="category-dropdown-btn"
                    onClick={() => setAdminGenreDropdownOpen((open) => !open)}
                  >
                    {editingBook.genres && editingBook.genres.length > 0
                      ? `Выбрано жанров: ${editingBook.genres.length}`
                      : "Выберите жанры"}
                    <span aria-hidden="true">{adminGenreDropdownOpen ? "▲" : "▼"}</span>
                  </button>
                  {adminGenreDropdownOpen && (
                    <div className="category-dropdown-menu">
                      <div className="genres-dropdown-list">
                        {GENRES.map((genre) => (
                          <label key={genre} className="rubric-option" style={{ cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={(editingBook.genres || []).includes(genre)}
                              onChange={(e) => {
                                const current = editingBook.genres || [];
                                const next = e.target.checked
                                  ? [...current, genre]
                                  : current.filter((g) => g !== genre);
                                setEditingBook({ ...editingBook, genres: next });
                              }}
                            />
                            <span>{genre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <label className="field">
                <span>Стеллаж</span>
                <input
                  value={editingBook.rack ?? ""}
                  onChange={(e) => setEditingBook({ ...editingBook, rack: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Полка</span>
                <input
                  value={editingBook.shelf ?? ""}
                  onChange={(e) => setEditingBook({ ...editingBook, shelf: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Инвентарный номер</span>
                <input
                  value={editingBook.inventoryNumber ?? ""}
                  onChange={(e) => setEditingBook({ ...editingBook, inventoryNumber: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Путь или имя PDF</span>
                <input
                  value={editingBook.pdfPath ?? ""}
                  onChange={(e) => setEditingBook({ ...editingBook, pdfPath: e.target.value })}
                />
              </label>

              <label className="field full">
                <span>Аннотация</span>
                <textarea
                  value={editingBook.annotation ?? ""}
                  onChange={(e) => setEditingBook({ ...editingBook, annotation: e.target.value })}
                />
              </label>

              <label className="field full">
                <span>Выбрать PDF-файл для теста</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => attachPdf(e.target.files?.[0])}
                />
              </label>

              <label className="field full">
                <span>
                  <input
                    type="checkbox"
                    checked={editingBook.published !== false}
                    onChange={(e) => setEditingBook({ ...editingBook, published: e.target.checked })}
                    style={{ width: "auto", marginRight: 8 }}
                  />
                  Опубликована в каталоге
                </span>
              </label>
            </div>

            <p className="notice">
              В локальном прототипе выбранный PDF доступен только до перезагрузки
              страницы. Для постоянного хранения потребуется объектное хранилище и
              серверная загрузка.
            </p>
            <button type="submit">Сохранить карточку</button>
          </form>
        </div>
      )}

      {selectedBook && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-label="Карточка книги">
            <div className="topbar">
              <h2>{selectedBook.title}</h2>
              <button className="secondary" onClick={() => setSelectedBook(null)}>
                Закрыть
              </button>
            </div>
            <p><strong>Автор:</strong> {selectedBook.authors.join(", ") || "—"}</p>
            <p><strong>Год:</strong> {selectedBook.year ?? "—"}</p>
            <p><strong>Издательство:</strong> {selectedBook.publisher || "—"}</p>
            <p><strong>Категория:</strong> {selectedBook.category || "—"}</p>
            <p><strong>Жанры:</strong> {selectedBook.genres?.join(", ") || "—"}</p>
            <p><strong>Аннотация:</strong> {selectedBook.annotation || "—"}</p>
            <p><strong>Стеллаж:</strong> {selectedBook.rack || "—"}</p>
            <p><strong>Полка:</strong> {selectedBook.shelf || "—"}</p>
            <p><strong>Инвентарный номер:</strong> {selectedBook.inventoryNumber || "—"}</p>
            {selectedBook.pdfPath && (
              <a href={pdfHref(selectedBook)} target="_blank" rel="noreferrer">
                Открыть PDF
              </a>
            )}
          </section>
        </div>
      )}

      {!admin && (
        <footer className="admin-footer">
          <h3>Вход для сотрудников</h3>
          <p className="muted" style={{ margin: "0 0 10px", fontSize: 14 }}>
            Демонстрационный PIN: <code>museum-demo</code>. Это не настоящая
            авторизация.
          </p>
          <form onSubmit={submitPin}>
            <div className="controls">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN для прототипа"
                autoComplete="current-password"
                style={{ maxWidth: 260 }}
              />
              <button type="submit">Войти</button>
            </div>
            {pinError && (
              <p className="error" style={{ marginTop: 8 }}>{pinError}</p>
            )}
          </form>
        </footer>
      )}
    </main>
  );
}