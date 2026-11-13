import { useEffect, useMemo, useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { russian } from "multilingual-stemmer";
import { books as seedBooks } from "./data/books";
import type { Book } from "./data/books";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type CategoryNode = {
  id: string;
  name: string;
  children?: CategoryNode[];
};

const CATEGORIES: CategoryNode[] = [
  {
    id: "fiction", name: "Художественная литература",
    children: [
      { id: "fiction-prose", name: "Проза" }, { id: "fiction-poetry", name: "Поэзия" },
      { id: "fiction-drama", name: "Драматургия" }, { id: "fiction-genres", name: "Литература по жанрам и темам" },
      { id: "fiction-folklore", name: "Устное народное творчество" }, { id: "fiction-children", name: "Литература для детей и юношества" },
      { id: "fiction-world", name: "Литература народов мира" },
    ],
  },
  {
    id: "nonfiction", name: "Нехудожественная литература",
    children: [
      { id: "nonfiction-philosophy", name: "Философия и религия" }, { id: "nonfiction-psychology", name: "Психология и саморазвитие" },
      { id: "nonfiction-society", name: "Общество и гуманитарные науки" }, { id: "nonfiction-history", name: "История" },
      { id: "nonfiction-geography", name: "География и путешествия" }, { id: "nonfiction-science", name: "Естественные науки" },
      { id: "nonfiction-tech", name: "Техника и технологии" }, { id: "nonfiction-medicine", name: "Здоровье и медицина" },
      { id: "nonfiction-art", name: "Искусство и культура" }, { id: "nonfiction-language", name: "Язык и литература" },
      { id: "nonfiction-home", name: "Дом и повседневная жизнь" }, { id: "nonfiction-sport", name: "Спорт и досуг" },
      { id: "nonfiction-business", name: "Бизнес и профессии" },
    ],
  },
  { id: "reference", name: "Справочные издания" },
  { id: "education", name: "Учебная и методическая литература" },
  { id: "periodicals", name: "Периодические и продолжающиеся издания" },
  { id: "formats", name: "Издания по формату и доступности" },
];

const GENRES: string[] = [
  "Альманахи и сборники", "Антологии поэзии", "Атласы и карты", "Баллады и сонеты",
  "Библиографические пособия", "Былины и эпос", "Военная проза", "Газеты",
  "Детективы и триллеры", "Детская проза и поэзия", "Историческая проза",
  "Книги для дошкольников", "Книги для младшего школьного возраста",
  "Книги для подростков", "Книги для юношества", "Комедии", "Легенды и предания",
  "Любовная проза", "Методические материалы", "Мифы и мифологические сюжеты",
  "Повести", "Поэмы", "Приключения", "Пьесы", "Рассказы и новеллы", "Романы",
  "Самоучители и курсы", "Сборники прозы", "Сборники стихов", "Сказки",
  "Сказки и познавательные истории", "Словари", "Собрания сочинений и избранные произведения",
  "Социальная и реалистическая проза", "Справочники", "Стихотворения",
  "Трагедии и драмы", "Ужасы и мистика", "Учебники и пособия", "Фантастика",
  "Фольклорные сборники", "Фэнтези", "Хронологии и календари", "Энциклопедии",
  "Эссе и литературные миниатюры", "Юмор и сатира",
];

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
    node.children.forEach((child) => { names.push(...getCategoryNamesWithChildren(child.id)); });
  }
  return names;
}

function getCategoryName(id: string): string {
  const node = findCategoryById(id);
  return node ? node.name : id;
}

function normalizeBook(value: Partial<Book>): Book {
  const authors = Array.isArray(value.authors)
    ? value.authors.map((a) => String(a).trim()).filter(Boolean)
    : String(value.authors ?? "").split(/[|;]/).map((a) => a.trim()).filter(Boolean);

  const year = typeof value.year === "number"
    ? value.year
    : value.year && /^\d{1,4}$/.test(String(value.year)) ? Number(value.year) : undefined;

  const legacyGenre = (value as Record<string, unknown>).genre;
  const genres = Array.isArray(value.genres)
    ? value.genres.map(String).filter(Boolean)
    : typeof legacyGenre === "string" ? [legacyGenre] : [];

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
    inventoryNumber: String(value.id ?? "").trim(),
    pdfPath: String(value.pdfPath ?? "").trim(),
    pdfUrl: String(value.pdfUrl ?? "").trim(),
    pdfFileName: String(value.pdfFileName ?? "").trim(),
    published: value.published !== false,
  };
}

function stemText(text: string): string[] {
  const normalized = text.toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
  return normalized.split(/[^a-zа-я0-9]+/i).filter(Boolean).map((word) => russian(word));
}

function bookStems(book: Book): string[] {
  const text = [
    book.title, ...book.authors, book.publisher, book.category,
    ...(book.genres || []), book.annotation, book.inventoryNumber, book.year?.toString(),
  ].filter(Boolean).join(" ");
  return stemText(text);
}

function matchesSearch(book: Book, query: string): boolean {
  const queryStems = stemText(query);
  if (queryStems.length === 0) return true;
  const bookStemList = bookStems(book);
  return queryStems.every((stem) => bookStemList.includes(stem));
}

function getPdfUrl(book: Book): string {
  if (book.pdfUrl && book.pdfUrl.startsWith("http")) return book.pdfUrl;
  if (book.pdfUrl) return `${import.meta.env.BASE_URL}${book.pdfUrl.replace(/^\//, "")}`;
  if (book.pdfPath) {
    if (book.pdfPath.startsWith("http")) return book.pdfPath;
    return `${import.meta.env.BASE_URL}${book.pdfPath.replace(/^\//, "")}`;
  }
  return "";
}

// --- PDF-ОБЛОЖКА ---
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
          ? src : `${import.meta.env.BASE_URL}${src}`;

        const pdf = await pdfjsLib.getDocument({
          url: resolved, wasmUrl: `${import.meta.env.BASE_URL}pdfjs/wasm/`,
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

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
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
        <span className="cover-placeholder" style={{ color: failed ? "var(--color-error)" : "var(--color-muted)", fontWeight: failed ? 600 : 400 }}>
          {failed ? "Не удалось загрузить обложку" : "Загрузка обложки…"}
        </span>
      )}
    </div>
  );
}

export default function App() {
  const books = useMemo(() => seedBooks.map(normalizeBook), []);

  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<"catalog" | "about" | "download">("catalog");

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    const t = saved === "dark" ? "dark" : "light";
    if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", t);
    return t;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => { setVisibleCount(5); }, [query, selectedCategory, selectedGenres, yearRange]);

  const filterableBooks = useMemo(() => books.filter((book) => book.published !== false), [books]);

  const yearBounds = useMemo(() => {
    const years = filterableBooks.map((book) => book.year).filter((year): year is number => typeof year === "number");
    if (years.length === 0) return null;
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [filterableBooks]);

  const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedGenres.length > 0 ? 1 : 0) + (yearRange ? 1 : 0);

  function toggleGenre(genre: string) {
    setSelectedGenres((current) => current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre]);
  }

  function toggleCategoryExpand(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedCategoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const visibleBooks = useMemo(() => {
    return books.filter((book) => {
      if (book.published === false) return false;
      if (selectedCategory) {
        const selectedNames = getCategoryNamesWithChildren(selectedCategory);
        if (!selectedNames.includes(book.category || "")) return false;
      }
      if (selectedGenres.length > 0) {
        const bookGenres = book.genres || [];
        if (!selectedGenres.some((g) => bookGenres.includes(g))) return false;
      }
      if (yearRange) {
        if (typeof book.year !== "number" || book.year < yearRange[0] || book.year > yearRange[1]) return false;
      }
      return matchesSearch(book, query);
    });
  }, [books, selectedCategory, selectedGenres, yearRange, query]);

  const handleSurprise = () => {
    if (filterableBooks.length === 0) return;
    const randomBook = filterableBooks[Math.floor(Math.random() * filterableBooks.length)];
    setCurrentPage("catalog");
    setSelectedBook(randomBook);
    setMenuOpen(false);
  };

  const handleDownloadCsv = () => {
    const headers = [
      "ID", "Название", "Автор", "Год", "Издательство", "Категория",
      "Жанры", "Аннотация", "Шкаф", "Полка", "Инвентарный номер", "Ссылка на PDF",
    ];
    const rows = books.map((b) => [
      b.id, b.title, b.authors.join("; "), b.year ?? "",
      b.publisher ?? "", b.category ?? "", (b.genres ?? []).join("; "),
      b.annotation ?? "", b.rack ?? "", b.shelf ?? "",
      b.inventoryNumber ?? "", getPdfUrl(b),
    ]);

    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bazhov-library-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  function renderCategoryNode(node: CategoryNode, depth = 0) {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedCategory === node.id;
    const isExpanded = expandedCategoryIds.includes(node.id);

    return (
      <div key={node.id} style={{ marginLeft: depth * 12 }}>
        <div className="category-row">
          {hasChildren ? (
            <button type="button" className="expand-btn" onClick={(e) => toggleCategoryExpand(node.id, e)} aria-label={isExpanded ? "Свернуть" : "Развернуть"}>
              {isExpanded ? "▼" : "►"}
            </button>
          ) : (<span className="expand-spacer" />)}
          <label className="rubric-option" style={{ flex: 1, cursor: "pointer" }}>
            <input
              type="radio" name="category-filter" checked={isSelected}
              onChange={() => { setSelectedCategory(isSelected ? "" : node.id); setCategoryDropdownOpen(false); }}
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

  return (
    <main className="app">
      <style>{`
        @font-face {
          font-family: "Wremena";
          src: url("${import.meta.env.BASE_URL}fonts/Wremena Bold.otf") format("opentype");
          font-weight: 700; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "Moniqa";
          src: url("${import.meta.env.BASE_URL}fonts/Moniqa-SemBdCondHeading.otf") format("opentype");
          font-weight: 600; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "Cochin";
          src: url("${import.meta.env.BASE_URL}fonts/Cochin.ttc");
          font-weight: 500; font-style: normal; font-display: swap;
        }

        :root, [data-theme="light"] {
          --color-green: #31563f;
          --color-green-dark: #254531;
          --color-green-light: #f0f3ef;
          --color-bg: #f6f5f1;
          --color-surface: #ffffff;
          --color-text: #252b25;
          --color-muted: #62675f;
          --color-border: #e6e3da;
          --color-danger: #9d3535;
          --color-warning: #8a5b00;
          --color-error: #a12f2f;
          --font-display: "Wremena", Georgia, "Times New Roman", serif;
          --font-body: "Cochin", Georgia, system-ui, -apple-system, serif;
        }

        [data-theme="dark"] {
          --color-green: #31563f;
          --color-green-dark: #4a7a5e;
          --color-green-light: #2a3a30;
          --color-bg: #1e1e1e;
          --color-surface: #2a2826;
          --color-text: #edece8;
          --color-muted: #a8a5a0;
          --color-border: #3a3836;
          --color-danger: #d35f5f;
          --color-warning: #e0a04a;
          --color-error: #e78080;
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
          transition: background 0.2s, color 0.2s;
        }

        button, input, select, textarea { font: inherit; }
        button { cursor: pointer; }

        .app { max-width: 1120px; margin: 0 auto; padding: 32px 24px 80px; }

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

        /* --- Бургер --- */
        .burger-btn {
          background: transparent;
          color: var(--color-green);
          border: 1.5px solid var(--color-green);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 1.4rem;
          line-height: 1;
          min-width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }

        .burger-btn:hover { background: var(--color-green); color: #fff; }

        /* --- Меню --- */
        .menu-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 100;
          animation: fadeIn 0.2s ease-out;
        }

        .side-menu {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 340px;
          max-width: 90vw;
          background: var(--color-surface);
          z-index: 101;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.25s ease-out;
        }

        .side-menu .menu-close {
          align-self: flex-end;
          background: transparent;
          color: var(--color-text);
          border: none;
          font-size: 1.6rem;
          padding: 4px 10px;
          line-height: 1;
          margin-bottom: 12px;
          border-radius: 4px;
        }

        .side-menu .menu-close:hover { background: var(--color-bg); }

        /* --- Пункты меню: Wremena, увеличенный кегль, без смайликов --- */
        .side-menu .menu-item {
          background: transparent;
          color: var(--color-text);
          border: none;
          text-align: left;
          padding: 16px 18px;
          font-size: 1.2rem;
          border-radius: 6px;
          font-family: var(--font-display);
          font-weight: 700;
          letter-spacing: 0.01em;
          transition: background 0.15s, color 0.15s;
        }

        .side-menu .menu-item:hover { background: var(--color-bg); color: var(--color-green); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

        /* --- Панели / страницы --- */
        .panel {
          padding: 24px;
          margin: 0 0 32px;
          background: var(--color-surface);
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

        .page-title {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-green);
          margin: 0 0 20px;
        }

        .page-content p {
          font-size: 1rem;
          line-height: 1.7;
          color: var(--color-text);
          margin: 0 0 16px;
        }

        /* --- Поиск --- */
        .search-area { margin-bottom: 40px; }

        .search-line {
          display: flex;
          gap: 12px;
          align-items: stretch;
          flex-wrap: wrap;
        }

        .search-input {
          flex: 1 1 320px;
          min-width: 0;
          min-height: 56px;
          padding: 0 20px;
          border: 1.5px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-surface);
          color: var(--color-text);
          font-size: 1rem;
          font-family: var(--font-body);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .search-input:focus { border-color: var(--color-green); box-shadow: 0 0 0 3px rgb(49 86 63 / 20%); }
        .search-input::placeholder { color: var(--color-muted); }

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
          flex-shrink: 0;
        }

        .filters-button:hover, .filters-button.active { background: var(--color-green); color: #fff; }

        .filters-panel {
          margin-top: 16px;
          padding: 24px;
          background: var(--color-surface);
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

        .category-dropdown { position: relative; }

        .category-dropdown-btn {
          width: 100%;
          text-align: left;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--color-surface);
          color: var(--color-text);
          border: 1.5px solid var(--color-border);
          padding: 10px 14px;
          border-radius: 6px;
          font-weight: 400;
          font-size: 0.95rem;
        }

        .category-dropdown-btn:hover { border-color: var(--color-green); }

        .category-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 10;
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: 6px;
          max-height: 300px;
          overflow-y: auto;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .genres-dropdown-list { display: flex; flex-direction: column; gap: 8px; }

        .category-row { display: flex; align-items: center; gap: 6px; padding: 2px 0; }

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
          border-radius: 4px;
        }

        .expand-btn:hover { background: var(--color-bg); color: var(--color-green); }

        .expand-spacer { width: 24px; }

        .rubric-option { display: flex; align-items: center; gap: 8px; font-size: 0.95rem; }
        .rubric-option input { width: auto; margin: 0; accent-color: var(--color-green); }

        .rubric-children { display: grid; gap: 4px; margin-top: 4px; }

        .year-values {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 0.9rem;
          color: var(--color-muted);
          font-variant-numeric: tabular-nums;
        }

        .year-slider-wrap { padding: 8px 4px; }

        .rc-slider-rail { background: var(--color-border) !important; height: 4px; }
        .rc-slider-track { background: var(--color-green) !important; height: 4px; }
        .rc-slider-handle {
          width: 18px !important; height: 18px !important; margin-top: -7px !important;
          border: 2px solid var(--color-green) !important; background: #fff !important; opacity: 1 !important;
        }
        .rc-slider-handle:hover, .rc-slider-handle:focus, .rc-slider-handle-dragging {
          border-color: var(--color-green-dark) !important;
          box-shadow: 0 0 0 4px rgb(49 86 63 / 25%) !important;
        }

        .filter-actions { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid var(--color-border); }

        /* --- Кнопки --- */
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

        button.secondary:hover { background: var(--color-green); color: #fff; }

        /* --- Каталог --- */
        .grid { display: grid; grid-template-columns: 1fr; gap: 20px; }

        .book-card {
          padding: 24px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 12px 28px;
          align-items: start;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .book-card:hover { box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08); transform: translateY(-2px); }

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
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .cover-image { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cover-placeholder { font-size: 0.8rem; text-align: center; padding: 8px; line-height: 1.4; }

        .book-info {
          grid-column: 2;
          grid-row: 2;
          min-width: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 32px;
          align-content: start;
        }

        .book-info > h2, .book-info > .card-actions { grid-column: 1 / -1; }

        .book-info > h2 {
          margin: 0 0 8px;
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 1.25;
          color: var(--color-green);
        }

        .book-info p { margin: 0; font-size: 0.95rem; line-height: 1.5; color: var(--color-text); }
        .book-info p strong {
          display: block;
          font-weight: 600;
          color: var(--color-muted);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
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

        .card-actions a:hover { background: var(--color-green); color: #fff; }

        .load-more-container { display: flex; justify-content: center; margin-top: 32px; margin-bottom: 16px; }
        .load-more-container button { padding: 12px 32px; font-size: 1rem; min-width: 200px; }

        /* --- Модальное окно --- */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 5;
          display: grid;
          place-items: center;
          padding: 16px;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
        }

        .modal {
          width: min(720px, 100%);
          max-height: 90vh;
          overflow: auto;
          padding: 32px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal .topbar { padding-bottom: 14px; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); }

        .modal h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-green);
        }

        /* --- Раскладка с обложкой в модальном окне --- */
        .modal-book-layout {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 24px;
          margin-bottom: 20px;
          align-items: start;
        }

        .modal-cover {
          width: 160px;
          aspect-ratio: 3 / 4;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--color-border);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .modal-cover .cover-wrap {
          width: 100%;
          height: 100%;
          grid-column: auto;
          grid-row: auto;
          box-shadow: none;
          border: none;
          border-radius: 0;
        }

        .modal-book-main p { margin: 0 0 10px; font-size: 0.95rem; line-height: 1.55; color: var(--color-text); }
        .modal-book-main p strong {
          font-weight: 700;
          color: var(--color-muted);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-right: 6px;
        }

        .modal p { margin: 0 0 10px; font-size: 0.95rem; line-height: 1.55; color: var(--color-text); }
        .modal p strong {
          font-weight: 700;
          color: var(--color-muted);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-right: 6px;
        }

        .modal a { color: var(--color-green); font-weight: 500; text-decoration: none; border-bottom: 1px solid var(--color-green); }

        /* --- Мобильная версия --- */
        @media (max-width: 700px) {
          .app { padding: 20px 16px 60px; }
          .topbar { margin-bottom: 24px; padding-bottom: 16px; }

          .book-card { grid-template-columns: 1fr; gap: 16px; }
          .tag { grid-column: 1; grid-row: auto; }
          .cover-wrap { grid-column: 1; grid-row: auto; justify-self: center; width: 140px; }
          .book-info { grid-column: 1; grid-row: auto; width: 100%; }

          .search-line {
            flex-direction: row;
            align-items: stretch;
            flex-wrap: nowrap;
            gap: 8px;
          }

          .search-input {
            flex: 1 1 0;
            min-width: 0;
            min-height: 46px;
            padding: 0 12px;
            font-size: 0.9rem;
          }

          .search-input::placeholder { font-size: 0.82rem; }

          .filters-button {
            min-height: 46px;
            padding: 0 12px;
            font-size: 0.82rem;
          }

          .modal { padding: 24px; }
          .filters-panel { padding: 20px; }

          /* Мобильная раскладка модального окна */
          .modal-book-layout {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .modal-cover {
            width: 140px;
            justify-self: center;
          }
        }
      `}</style>

      <header className="topbar">
        <div className="brand">
          <h1>Электронная библиотека</h1>
          <div className="muted">Книжная коллекция дома-музея П. П. Бажова</div>
        </div>
        <button className="burger-btn" onClick={() => setMenuOpen(true)} aria-label="Открыть меню">☰</button>
      </header>

      {/* --- БОКОВОЕ МЕНЮ --- */}
      {menuOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
          <nav className="side-menu" aria-label="Главное меню">
            <button className="menu-close" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">×</button>
            <button className="menu-item" onClick={() => { setCurrentPage("catalog"); setMenuOpen(false); }}>Каталог</button>
            <button className="menu-item" onClick={() => { setCurrentPage("about"); setMenuOpen(false); }}>О проекте</button>
            <button className="menu-item" onClick={() => { setCurrentPage("download"); setMenuOpen(false); }}>Скачать каталог</button>
            <button className="menu-item" onClick={handleSurprise}>Удивите меня</button>
            <button className="menu-item" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? "Тёмная тема" : "Светлая тема"}
            </button>
          </nav>
        </>
      )}

      {/* --- СТРАНИЦА: О ПРОЕКТЕ --- */}
      {currentPage === "about" && (
        <section className="panel">
          <h1 className="page-title">О проекте</h1>
          <div className="page-content">
            <p>Здесь будет текст, описывающий работу сайта, историю коллекции и цели проекта.</p>
            <p className="muted">(Текст будет добавлен позже)</p>
          </div>
        </section>
      )}

      {/* --- СТРАНИЦА: СКАЧАТЬ КАТАЛОГ --- */}
      {currentPage === "download" && (
        <section className="panel">
          <h1 className="page-title">Скачать каталог</h1>
          <div className="page-content">
            <p>Вы можете сохранить полный каталог книг в формате CSV. Файл откроется в Excel или любой программе для работы с таблицами.</p>
            <p>В каталог включены все данные: ID, название, авторы, год, издательство, категория, жанры, аннотация, место хранения и ссылка на PDF-файл.</p>
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={handleDownloadCsv}>
              Скачать каталог (CSV)
            </button>
          </div>
        </section>
      )}

      {/* --- СТРАНИЦА: КАТАЛОГ --- */}
      {currentPage === "catalog" && (
        <>
          <section className="panel">
            <strong>Каталог для посетителей</strong>
            <p className="muted">Используйте поиск по библиографическим данным или откройте фильтры, чтобы уточнить категорию, жанр и год издания.</p>
          </section>

          <section className="search-area" aria-label="Поиск и фильтры">
            <div className="search-line">
              <input
                className="search-input" type="search" value={query}
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
                <span aria-hidden="true" style={{ marginLeft: 6 }}>{filtersOpen ? "▲" : "▼"}</span>
              </button>
            </div>

            {filtersOpen && (
              <div className="filters-panel">
                <div className="filter-section">
                  <h3>Категория</h3>
                  <div className="category-dropdown">
                    <button type="button" className="category-dropdown-btn" onClick={() => setCategoryDropdownOpen((open) => !open)}>
                      {selectedCategory ? getCategoryName(selectedCategory) : "Все категории"}
                      <span aria-hidden="true">{categoryDropdownOpen ? "▲" : "▼"}</span>
                    </button>
                    {categoryDropdownOpen && (
                      <div className="category-dropdown-menu">
                        <label className="rubric-option" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--color-border)" }}>
                          <input type="radio" name="category-filter" checked={selectedCategory === ""}
                            onChange={() => { setSelectedCategory(""); setCategoryDropdownOpen(false); }} />
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
                    <button type="button" className="category-dropdown-btn" onClick={() => setGenreDropdownOpen((open) => !open)}>
                      {selectedGenres.length > 0 ? `Выбрано жанров: ${selectedGenres.length}` : "Все жанры"}
                      <span aria-hidden="true">{genreDropdownOpen ? "▲" : "▼"}</span>
                    </button>
                    {genreDropdownOpen && (
                      <div className="category-dropdown-menu">
                        <div className="genres-dropdown-list">
                          {GENRES.map((genre) => (
                            <label key={genre} className="rubric-option" style={{ cursor: "pointer" }}>
                              <input type="checkbox" checked={selectedGenres.includes(genre)} onChange={() => toggleGenre(genre)} />
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
                      <Slider range min={yearBounds.min} max={yearBounds.max}
                        value={yearRange ?? [yearBounds.min, yearBounds.max]}
                        onChange={(value) => { if (Array.isArray(value) && value.length === 2) setYearRange([value[0], value[1]]); }}
                        allowCross={false} />
                    </div>
                    <small className="muted">Доступный диапазон: {yearBounds.min}–{yearBounds.max}</small>
                  </div>
                )}

                <div className="filter-actions">
                  <button type="button" className="secondary" onClick={() => { setSelectedCategory(""); setSelectedGenres([]); setYearRange(null); }}>
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            )}
          </section>

          <p className="muted">Найдено книг: {visibleBooks.length}</p>

          {visibleBooks.length === 0 ? (
            <section className="panel">По вашему запросу ничего не найдено.</section>
          ) : (
            <>
              <section className="grid">
                {visibleBooks.slice(0, visibleCount).map((book) => {
                  const fileUrl = getPdfUrl(book);
                  return (
                    <article className="book-card" key={book.id}>
                      <span className="tag">{book.category || "Без категории"}</span>
                      {fileUrl && <PdfCover src={fileUrl} alt={`Обложка книги «${book.title}»`} />}
                      <div className="book-info">
                        <h2>
                          <span
                            type="button"
                            className="title-btn"
                            onClick={() => setSelectedBook(book)}
                          >
                            {book.title}
                          </span>
                        </h2>
                        {book.authors.length > 0 && (<p><strong>Автор</strong>{book.authors.join(", ")}</p>)}
                        {book.year && (<p><strong>Год издания</strong>{book.year}</p>)}
                        {book.publisher && (<p><strong>Издательство</strong>{book.publisher}</p>)}
                        <div className="card-actions">
                          <button className="secondary" onClick={() => setSelectedBook(book)}>Подробнее</button>
                          {fileUrl && (
                            <a href={fileUrl} target="_blank" rel="noreferrer" download={!fileUrl.startsWith("http") ? book.pdfPath?.split("/").pop() : undefined}>
                              Скачать PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>

              {visibleCount < visibleBooks.length && (
                <div className="load-more-container">
                  <button type="button" className="secondary" onClick={() => setVisibleCount((prev) => prev + 10)}>Показать еще</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* --- МОДАЛЬНОЕ ОКНО "ПОДРОБНЕЕ" --- */}
      {selectedBook && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedBook(null)}>
          <section className="modal" role="dialog" aria-modal="true" aria-label="Карточка книги" onClick={(e) => e.stopPropagation()}>
            <div className="topbar">
              <h2>{selectedBook.title}</h2>
              <button className="secondary" onClick={() => setSelectedBook(null)}>Закрыть</button>
            </div>

            <div className="modal-book-layout">
              {getPdfUrl(selectedBook) && (
                <div className="modal-cover">
                  <PdfCover src={getPdfUrl(selectedBook)} alt={`Обложка книги «${selectedBook.title}»`} />
                </div>
              )}
              <div className="modal-book-main">
                <p><strong>Автор:</strong> {selectedBook.authors.join(", ") || "—"}</p>
                <p><strong>Год:</strong> {selectedBook.year ?? "—"}</p>
                <p><strong>Издательство:</strong> {selectedBook.publisher || "—"}</p>
                <p><strong>Категория:</strong> {selectedBook.category || "—"}</p>
                <p><strong>Жанры:</strong> {selectedBook.genres?.join(", ") || "—"}</p>
                <p><strong>Стеллаж:</strong> {selectedBook.rack || "—"}</p>
                <p><strong>Полка:</strong> {selectedBook.shelf || "—"}</p>
                <p><strong>Инвентарный номер:</strong> {selectedBook.inventoryNumber || "—"}</p>
              </div>
            </div>

            <p><strong>Аннотация:</strong> {selectedBook.annotation || "—"}</p>

            {getPdfUrl(selectedBook) && (
              <p style={{ marginTop: 16 }}>
                <a href={getPdfUrl(selectedBook)} target="_blank" rel="noreferrer">Открыть PDF</a>
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}