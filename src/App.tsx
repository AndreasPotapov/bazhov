import { useEffect, useMemo, useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { russian } from "multilingual-stemmer";
import { books as seedBooks } from "./data/books";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// --- ТИП (полный, чтобы TS не ругался) ---
type Book = {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  publisher?: string;
  category?: string;
  categories?: string[];
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
  processing?: boolean;
};

// --- РУБРИКАТОР ---
const RUBRICATOR = [
  {
    id: "book-editions", name: "Книжные издания",
    genres: [
      "Романы", "Повести", "Рассказы и новеллы", "Очерки", "Историческая проза", "Социальная и реалистическая проза",
      "Приключенческая проза", "Биографическая проза", "Мемуары и воспоминания", "Юмор и сатира",
      "Мистика и фантастика", "Триллеры и детективы", "Произведения об Урале", "Произведения уральских писателей",
      "Стихотворения", "Поэмы", "Баллады", "Лирическая поэзия", "Эпическая поэзия", "Сатирическая поэзия",
      "Народная поэзия", "Поэзия уральских авторов", "Пьесы", "Драмы", "Комедии", "Трагедии",
      "Историческая драматургия", "Драматические произведения для детей", "Сказы П. П. Бажова",
      "Сказы других уральских писателей", "Литературные сказания", "Сказовые циклы", "Сказы о горняках и мастерах",
      "Сказы о природе и богатствах Урала", "Народные песни", "Народные сказки", "Былины и эпос",
      "Фольклорные сборники", "Уральские легенды и предания", "Загадки, пословицы и поговорки",
      "Детская поэзия", "Сказы для детей", "Познавательная и краеведческая литература для детей",
      "Литературные и народные сказки", "Детские рассказы и повести", "Иллюстрированные детские издания",
      "Книги для дошкольников", "Книги для младшего школьного возраста", "Книги для подростков",
      "Биографии", "Автобиографии", "Мемуары", "Воспоминания", "Дневники", "Письма и переписка",
      "Документальная проза", "Публицистика", "Эссе", "Литературная критика", "Статьи",
      "Литературные миниатюры", "Путевые заметки", "Репортажи", "Фельетон и памфлет", "Интервью и беседа"
    ]
  },
  {
    id: "periodicals", name: "Периодические издания",
    genres: ["Литературные журналы", "Научные журналы", "Исторические журналы", "Краеведческие журналы", "Детские журналы", "Общественно-культурные журналы", "Газеты", "Литературные альманахи", "Научные периодические сборники"]
  },
  {
    id: "cartographic", name: "Картографические издания",
    genres: ["Географические карты", "Исторические карты", "Топографические карты", "Геологические карты", "Карты Урала", "Карты Екатеринбурга и Свердловской области", "Атласы", "Планы городов и населённых пунктов"]
  },
  {
    id: "reference", name: "Справочные издания",
    genres: ["Энциклопедии", "Литературные энциклопедии", "Исторические энциклопедии", "Словари", "Толковые словари", "Фольклорные словари", "Литературоведческие словари", "Географические справочники", "Минералогические справочники", "Библиографические указатели", "Каталоги", "Путеводители"]
  },
  {
    id: "educational", name: "Учебные и методические издания",
    genres: ["Учебники", "Учебные пособия", "Методические рекомендации", "Методические разработки", "Хрестоматии", "Сборники упражнений", "Материалы для преподавателей", "Материалы для внеклассного чтения", "Пособия по краеведению", "Пособия по литературе и фольклору"]
  },
  {
    id: "scientific", name: "Научные издания",
    genres: ["Монографии", "Диссертации", "Авторефераты диссертаций", "Научные статьи", "Сборники научных работ", "Материалы конференций", "Литературоведческие исследования", "Фольклористические исследования", "Исторические исследования", "Этнографические исследования", "Геологические и минералогические исследования", "Искусствоведческие исследования"]
  },
  {
    id: "collections", name: "Сборники и собрания сочинений",
    genres: ["Собрания сочинений П. П. Бажова", "Сборники сказов", "Сборники рассказов", "Сборники стихотворений", "Сборники народного фольклора", "Сборники уральских писателей", "Антологии", "Коллективные литературные сборники", "Избранные произведения", "Тематические литературные сборники"]
  },
  {
    id: "special-formats", name: "Издания специального формата",
    genres: ["Иллюстрированные издания", "Альбомы", "Фотоальбомы", "Коллекционные издания", "Книги с автографами", "Факсимильные издания", "Редкие и старинные издания"]
  }
];

// --- КОМПОНЕНТ РУБРИКАТОРА ---
function RubricatorSelector({ 
  selectedCategories, 
  selectedGenres, 
  onChange 
}: { 
  selectedCategories: string[]; 
  selectedGenres: string[]; 
  onChange: (cats: string[], genres: string[]) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleCategory = (catName: string) => {
    const cat = RUBRICATOR.find(c => c.name === catName);
    if (!cat) return;

    if (selectedCategories.includes(catName)) {
      onChange(
        selectedCategories.filter(c => c !== catName),
        selectedGenres.filter(g => !cat.genres.includes(g))
      );
    } else {
      onChange(
        [...selectedCategories, catName],
        [...new Set([...selectedGenres, ...cat.genres])]
      );
    }
  };

  const toggleGenre = (genreName: string, parentCatName: string) => {
    const cat = RUBRICATOR.find(c => c.name === parentCatName);
    if (!cat) return;

    let newGenres: string[];
    let newCategories = [...selectedCategories];

    if (selectedGenres.includes(genreName)) {
      newGenres = selectedGenres.filter(g => g !== genreName);
      newCategories = newCategories.filter(c => c !== parentCatName);
    } else {
      newGenres = [...selectedGenres, genreName];
      const allCatGenresSelected = cat.genres.every(g => newGenres.includes(g));
      if (allCatGenresSelected && !newCategories.includes(parentCatName)) {
        newCategories.push(parentCatName);
      }
    }

    onChange(newCategories, newGenres);
  };

  const reset = () => onChange([], []);

  return (
    <div className="dropdown-container" style={{ position: 'relative', zIndex: 50 }}>
      <button type="button" className="category-dropdown-btn" onClick={() => setIsOpen(!isOpen)}>
        <span>
          {selectedCategories.length === 0 && selectedGenres.length === 0 
            ? "Все категории и жанры" 
            : `Выбрано: ${selectedCategories.length} кат., ${selectedGenres.length} жанров`}
        </span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, 
          background: '#fff', border: '1px solid #ccc', borderRadius: '4px', 
          padding: '8px', maxHeight: '400px', overflowY: 'auto', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            <button type="button" className="secondary" onClick={reset} style={{ fontSize: '12px', padding: '4px 8px' }}>Сбросить выбор</button>
            <button type="button" className="secondary" onClick={() => setIsOpen(false)} style={{ fontSize: '12px', padding: '4px 8px' }}>Закрыть</button>
          </div>

          {RUBRICATOR.map(cat => {
            const isExpanded = expanded.includes(cat.id);
            const isCatSelected = selectedCategories.includes(cat.name);
            return (
              <div key={cat.id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                  <button 
                    type="button" 
                    onClick={() => setExpanded(prev => prev.includes(cat.id) ? prev.filter(x => x !== cat.id) : [...prev, cat.id])} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', width: '20px', padding: 0, fontSize: '12px', color: '#666' }}
                  >
                    {isExpanded ? "▼" : "►"}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => toggleCategory(cat.name)}>
                    <input type="checkbox" checked={isCatSelected} onChange={(e) => { e.stopPropagation(); toggleCategory(cat.name); }} style={{ margin: 0, width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{cat.name}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ marginLeft: '28px', display: 'grid', gap: '4px', marginTop: '4px' }}>
                    {cat.genres.map(g => (
                      <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }} onClick={() => toggleGenre(g, cat.name)}>
                        <input type="checkbox" checked={selectedGenres.includes(g)} onChange={(e) => { e.stopPropagation(); toggleGenre(g, cat.name); }} style={{ margin: 0, width: '16px', height: '16px' }} />
                        <span style={{ color: '#555' }}>{g}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- НОРМАЛИЗАЦИЯ ---
function normalizeBook(value: any): Book {
  const authors = Array.isArray(value.authors)
    ? value.authors.map((a: any) => String(a).trim()).filter(Boolean)
    : String(value.authors ?? "").split(/[|;]/).map((a) => a.trim()).filter(Boolean);

  const year = typeof value.year === "number"
    ? value.year
    : value.year && /^\d{1,4}$/.test(String(value.year)) ? Number(value.year) : undefined;

  const legacyGenre = value.genre;
  const genres = Array.isArray(value.genres)
    ? value.genres.map(String).filter(Boolean)
    : typeof legacyGenre === "string" ? [legacyGenre] : [];

  const rawCategories = value.categories;
  const categories = Array.isArray(rawCategories)
    ? rawCategories.map(String).filter(Boolean)
    : value.category ? [String(value.category).trim()].filter(Boolean) : [];

  return {
    id: String(value.id ?? "").trim(),
    title: String(value.title ?? "").trim(),
    authors,
    year,
    publisher: String(value.publisher ?? "").trim(),
    category: String(value.category ?? categories[0] ?? "").trim(),
    categories,
    genres,
    annotation: String(value.annotation ?? "").trim(),
    rack: String(value.rack ?? "").trim(),
    shelf: String(value.shelf ?? "").trim(),
    inventoryNumber: String(value.id ?? "").trim(),
    pdfPath: String(value.pdfPath ?? "").trim(),
    pdfUrl: String(value.pdfUrl ?? "").trim(),
    ocrUrl: String(value.ocrUrl ?? "").trim(),
    pdfFileName: String(value.pdfFileName ?? "").trim(),
    published: value.published !== false,
    processing: value.processing,
  };
}

// --- ПОИСК ---
function stemText(text: string): string[] {
  const normalized = text.toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
  return normalized.split(/[^a-zа-я0-9]+/i).filter(Boolean).map((word) => russian(word));
}

function bookStems(book: Book): string[] {
  const text = [
    book.title, ...book.authors, book.publisher, ...(book.categories || []),
    ...(book.genres || []), book.annotation, book.inventoryNumber,
    book.year?.toString(), book.rack, book.shelf,
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
        const pdf = await pdfjsLib.getDocument({ url: resolved, wasmUrl: `${import.meta.env.BASE_URL}pdfjs/wasm/` }).promise;
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

// --- ПРИЛОЖЕНИЕ ---
export default function App() {
  const books = useMemo(() => seedBooks.map((b: any) => normalizeBook(b)), []);

  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  const [filterAuthor, setFilterAuthor] = useState("");
  const [filterPublisher, setFilterPublisher] = useState("");
  const [filterRack, setFilterRack] = useState("");
  const [filterShelf, setFilterShelf] = useState("");
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

  useEffect(() => {
    setVisibleCount(5);
  }, [query, selectedCategories, selectedGenres, yearRange, filterAuthor, filterPublisher, filterRack, filterShelf]);

  const filterableBooks = useMemo(() => books.filter((book: Book) => book.published !== false), [books]);

  const yearBounds = useMemo(() => {
    const years = filterableBooks.map((book: Book) => book.year).filter((year): year is number => typeof year === "number");
    if (years.length === 0) return null;
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [filterableBooks]);

  const activeFilterCount =
    (selectedCategories.length > 0 ? 1 : 0) +
    (selectedGenres.length > 0 ? 1 : 0) +
    (yearRange ? 1 : 0) +
    (filterAuthor.trim() ? 1 : 0) +
    (filterPublisher.trim() ? 1 : 0) +
    (filterRack ? 1 : 0) +
    (filterShelf ? 1 : 0);

  const visibleBooks = useMemo(() => {
    return books.filter((book: Book) => {
      if (book.published === false) return false;
      if (!matchesSearch(book, query)) return false;

      if (selectedGenres.length > 0 || selectedCategories.length > 0) {
        const categoryGenres = selectedCategories.flatMap(catName => {
          const cat = RUBRICATOR.find(c => c.name === catName);
          return cat ? cat.genres : [];
        });
        const allTargetGenres = [...new Set([...selectedGenres, ...categoryGenres])];
        const matchesGenre = allTargetGenres.length > 0 && allTargetGenres.some(g => (book.genres || []).includes(g));
        const matchesCategory = selectedCategories.length > 0 && selectedCategories.some(c => (book.categories || []).includes(c));
        if (!matchesGenre && !matchesCategory) return false;
      }

      if (yearRange) {
        if (typeof book.year !== "number" || book.year < yearRange[0] || book.year > yearRange[1]) return false;
      }

      if (filterAuthor.trim()) {
        const authorQuery = filterAuthor.toLocaleLowerCase("ru-RU").trim();
        if (!book.authors.some((a) => a.toLocaleLowerCase("ru-RU").includes(authorQuery))) return false;
      }

      if (filterPublisher.trim()) {
        const pubQuery = filterPublisher.toLocaleLowerCase("ru-RU").trim();
        if (!(book.publisher || "").toLocaleLowerCase("ru-RU").includes(pubQuery)) return false;
      }

      if (filterRack && book.rack !== filterRack) return false;
      if (filterShelf && book.shelf !== filterShelf) return false;

      return true;
    });
  }, [books, query, selectedCategories, selectedGenres, yearRange, filterAuthor, filterPublisher, filterRack, filterShelf]);

  const handleSurprise = () => {
    if (filterableBooks.length === 0) return;
    const randomBook = filterableBooks[Math.floor(Math.random() * filterableBooks.length)];
    setCurrentPage("catalog");
    setSelectedBook(randomBook);
    setMenuOpen(false);
  };

  const handleDownloadCsv = () => {
    const headers = [
      "ID", "Название", "Автор", "Год", "Издательство", "Категории",
      "Жанры", "Аннотация", "Шкаф", "Полка", "Инвентарный номер", "Ссылка на PDF",
    ];
    const rows = books.map((b: Book) => [
      b.id, b.title, b.authors.join("; "), b.year ?? "",
      b.publisher ?? "", (b.categories || []).join("; "), (b.genres ?? []).join("; "),
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
          --color-green: #31563f; --color-green-dark: #254531; --color-green-light: #f0f3ef;
          --color-bg: #f6f5f1; --color-surface: #ffffff; --color-text: #252b25;
          --color-muted: #62675f; --color-border: #e6e3da; --color-danger: #9d3535;
          --color-warning: #8a5b00; --color-error: #a12f2f;
          --font-display: "Wremena", Georgia, "Times New Roman", serif;
          --font-body: "Cochin", Georgia, system-ui, -apple-system, serif;
        }
        [data-theme="dark"] {
          --color-green: #31563f; --color-green-dark: #4a7a5e; --color-green-light: #2a3a30;
          --color-bg: #1e1e1e; --color-surface: #2a2826; --color-text: #edece8;
          --color-muted: #a8a5a0; --color-border: #3a3836; --color-danger: #d35f5f;
          --color-warning: #e0a04a; --color-error: #e78080;
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; transition: background 0.2s, color 0.2s; }
        button, input, select, textarea { font: inherit; }
        button { cursor: pointer; }
        .app { max-width: 1120px; margin: 0 auto; padding: 32px 24px 80px; display: flex; flex-direction: column; min-height: 100vh; }
        .topbar { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; padding-bottom: 20px; margin-bottom: 40px; border-bottom: 2px solid var(--color-green); }
        .brand h1 { margin: 0 0 6px; font-family: var(--font-display); font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 700; letter-spacing: -0.01em; color: var(--color-green); line-height: 1.15; }
        .brand .muted { font-size: 0.95rem; }
        .muted { color: var(--color-muted); }
        .burger-btn { background: transparent; color: var(--color-green); border: 1.5px solid var(--color-green); border-radius: 6px; padding: 8px 12px; font-size: 1.4rem; line-height: 1; min-width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s; }
        .burger-btn:hover { background: var(--color-green); color: #fff !important; }
        .menu-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); z-index: 100; animation: fadeIn 0.2s ease-out; }
        .side-menu { position: fixed; top: 0; right: 0; bottom: 0; width: 340px; max-width: 90vw; background: var(--color-surface); z-index: 101; padding: 20px 16px; display: flex; flex-direction: column; gap: 4px; box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2); animation: slideIn 0.25s ease-out; }
        .side-menu .menu-close { align-self: flex-end; background: transparent; color: var(--color-text); border: none; font-size: 1.6rem; padding: 4px 10px; line-height: 1; margin-bottom: 12px; border-radius: 4px; }
        .side-menu .menu-close:hover { background: var(--color-bg); }
        .side-menu .menu-item { background: transparent; color: var(--color-text); border: none; text-align: left; padding: 16px 18px; font-size: 1.2rem; border-radius: 6px; font-family: var(--font-display); font-weight: 700; letter-spacing: 0.01em; transition: background 0.15s, color 0.15s; }
        .side-menu .menu-item:hover { background: var(--color-bg); color: var(--color-green); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .panel { padding: 24px; margin: 0 0 32px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; }
        .panel strong { display: block; font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; margin-bottom: 6px; color: var(--color-green); }
        .panel p { margin: 0; }
        .page-title { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--color-green); margin: 0 0 20px; }
        .page-content p { font-size: 1rem; line-height: 1.7; color: var(--color-text); margin: 0 0 16px; }
        .search-area { margin-bottom: 40px; }
        .search-line { display: flex; gap: 12px; align-items: stretch; flex-wrap: wrap; }
        .search-input { flex: 1 1 320px; min-width: 0; min-height: 56px; padding: 0 20px; border: 1.5px solid var(--color-border); border-radius: 6px; background: var(--color-surface); color: var(--color-text); font-size: 1rem; font-family: var(--font-body); outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        .search-input:focus { border-color: var(--color-green); box-shadow: 0 0 0 3px rgb(49 86 63 / 20%); }
        .search-input::placeholder { color: var(--color-muted); }
        .filters-button { padding: 0 22px; min-height: 56px; border: 1.5px solid var(--color-green); border-radius: 6px; background: transparent; color: var(--color-green); font-family: var(--font-body); font-weight: 500; font-size: 0.95rem; white-space: nowrap; transition: background 0.15s, color 0.15s; flex-shrink: 0; }
        .filters-button:hover, .filters-button.active { background: var(--color-green); color: #fff !important; }
        .filters-panel { margin-top: 16px; padding: 24px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
        .filter-section h3 { margin: 0 0 12px; font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--color-green); }
        .filter-input { width: 100%; padding: 10px 14px; border: 1.5px solid var(--color-border); border-radius: 6px; background: var(--color-surface); color: var(--color-text); font-size: 0.95rem; outline: none; }
        .filter-input:focus { border-color: var(--color-green); }
        .category-dropdown-btn { width: 100%; text-align: left; display: flex; justify-content: space-between; align-items: center; background: var(--color-surface); color: var(--color-text); border: 1.5px solid var(--color-border); padding: 10px 14px; border-radius: 6px; font-weight: 400; font-size: 0.95rem; }
        .category-dropdown-btn:hover { border-color: var(--color-green); }
        .category-dropdown-menu { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 10; background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 6px; max-height: 300px; overflow-y: auto; padding: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        .year-values { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; color: var(--color-muted); font-variant-numeric: tabular-nums; }
        .year-slider-wrap { padding: 8px 4px; }
        .rc-slider-rail { background: var(--color-border) !important; height: 4px; }
        .rc-slider-track { background: var(--color-green) !important; height: 4px; }
        .rc-slider-handle { width: 18px !important; height: 18px !important; margin-top: -7px !important; border: 2px solid var(--color-green) !important; background: #fff !important; opacity: 1 !important; }
        .rc-slider-handle:hover, .rc-slider-handle:focus, .rc-slider-handle-dragging { border-color: var(--color-green-dark) !important; box-shadow: 0 0 0 4px rgb(49 86 63 / 25%) !important; }
        .storage-selects { display: flex; gap: 10px; }
        .storage-selects select { flex: 1; padding: 10px 14px; border: 1.5px solid var(--color-border); border-radius: 6px; background: var(--color-surface); color: var(--color-text); outline: none; }
        .storage-selects select:focus { border-color: var(--color-green); }
        .filter-actions { grid-column: 1 / -1; display: flex; gap: 10px; flex-wrap: wrap; padding-top: 16px; border-top: 1px solid var(--color-border); }
        button { border: 0; border-radius: 6px; padding: 10px 18px; background: var(--color-green); color: #fff; font-weight: 500; font-size: 0.95rem; transition: background 0.15s, color 0.15s; }
        button:hover { background: var(--color-green-dark); color: #fff !important; }
        button.secondary { color: var(--color-green); background: transparent; border: 1px solid var(--color-green); }
        button.secondary:hover { background: var(--color-green); color: #fff !important; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .book-card { padding: 24px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; display: grid; grid-template-columns: 140px 1fr; gap: 12px 28px; align-items: start; transition: box-shadow 0.2s, transform 0.2s; }
        .book-card:hover { box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08); transform: translateY(-2px); }
        .tag { grid-column: 2; grid-row: 1; justify-self: start; margin-bottom: 0; display: inline-block; padding: 3px 10px; border-radius: 2px; background: var(--color-bg); color: var(--color-muted); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
        .cover-wrap { grid-column: 1; grid-row: 2; width: 140px; aspect-ratio: 3 / 4; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }
        .cover-image { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cover-placeholder { font-size: 0.8rem; text-align: center; padding: 8px; line-height: 1.4; }
        .book-info { grid-column: 2; grid-row: 2; min-width: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px; align-content: start; }
        .book-info > h2, .book-info > .card-actions { grid-column: 1 / -1; }
        .book-info > h2 { margin: 0 0 8px; font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; line-height: 1.25; color: var(--color-green); }
        .title-btn { cursor: pointer; background: transparent !important; border: none !important; padding: 0 !important; margin: 0 !important; color: inherit !important; font: inherit !important; text-align: left; }
        .title-btn:hover { background: transparent !important; color: var(--color-green) !important; }
        .book-info p { margin: 0; font-size: 0.95rem; line-height: 1.5; color: var(--color-text); }
        .book-info p strong { display: block; font-weight: 600; color: var(--color-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .card-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; padding-top: 16px; border-top: 1px solid var(--color-border); }
        .card-actions a { display: inline-flex; align-items: center; padding: 8px 16px; color: var(--color-green); border: 1px solid var(--color-green); border-radius: 6px; text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: background 0.15s, color 0.15s; }
        .card-actions a:hover { background: var(--color-green); color: #fff !important; }
        .load-more-container { display: flex; justify-content: center; margin-top: 32px; margin-bottom: 16px; }
        .load-more-container button { padding: 12px 32px; font-size: 1rem; min-width: 200px; }
        .modal-backdrop { position: fixed; inset: 0; z-index: 5; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(2px); }
        .modal { width: min(720px, 100%); max-height: 90vh; overflow: auto; padding: 32px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
        .modal .topbar { padding-bottom: 14px; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); }
        .modal h2 { margin: 0; font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--color-green); }
        .modal-book-layout { display: grid; grid-template-columns: 160px 1fr; gap: 24px; margin-bottom: 20px; align-items: start; }
        .modal-cover { width: 160px; aspect-ratio: 3 / 4; border-radius: 4px; overflow: hidden; border: 1px solid var(--color-border); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
        .modal-cover .cover-wrap { width: 100%; height: 100%; grid-column: auto; grid-row: auto; box-shadow: none; border: none; border-radius: 0; }
        .modal-book-main p { margin: 0 0 10px; font-size: 0.95rem; line-height: 1.55; color: var(--color-text); }
        .modal-book-main p strong { font-weight: 700; color: var(--color-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; margin-right: 6px; }
        .modal p { margin: 0 0 10px; font-size: 0.95rem; line-height: 1.55; color: var(--color-text); }
        .modal p strong { font-weight: 700; color: var(--color-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; margin-right: 6px; }
        .modal a { color: var(--color-green); font-weight: 500; text-decoration: none; border-bottom: 1px solid var(--color-green); }
        .site-footer { margin-top: auto; padding-top: 60px; padding-bottom: 40px; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .footer-logos { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 40px; }
        .logo-placeholder { width: 140px; height: 70px; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: var(--color-muted); text-align: center; padding: 8px; }
        .footer-copyright { margin: 0; font-size: 0.85rem; color: var(--color-muted); text-align: center; }
        @media (max-width: 700px) {
          .app { padding: 20px 16px 60px; }
          .topbar { margin-bottom: 24px; padding-bottom: 16px; }
          .book-card { grid-template-columns: 1fr; gap: 16px; }
          .tag { grid-column: 1; grid-row: auto; }
          .cover-wrap { grid-column: 1; grid-row: auto; justify-self: center; width: 140px; }
          .book-info { grid-column: 1; grid-row: auto; width: 100%; }
          .search-line { flex-direction: row; align-items: stretch; flex-wrap: nowrap; gap: 8px; }
          .search-input { flex: 1 1 0; min-width: 0; min-height: 46px; padding: 0 12px; font-size: 0.9rem; }
          .search-input::placeholder { font-size: 0.82rem; }
          .filters-button { min-height: 46px; padding: 0 12px; font-size: 0.82rem; }
          .modal { padding: 24px; }
          .filters-panel { padding: 20px; grid-template-columns: 1fr; }
          .modal-book-layout { grid-template-columns: 1fr; gap: 16px; }
          .modal-cover { width: 140px; justify-self: center; }
          .footer-logos { gap: 20px; }
          .logo-placeholder { width: 100px; height: 50px; font-size: 0.7rem; }
        }
      `}</style>