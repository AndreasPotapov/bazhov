import { useState } from "react";
import Papa from "papaparse";
import type { Book } from "../data/books";

type PreviewRow = {
  rowNumber: number;
  book?: Book;
  errors: string[];
  warnings: string[];
};

const headerAliases = {
  id: ["ID записи", "ID"],
  title: ["Название"],
  authors: ["Автор(ы)", "Авторы", "Автор"],
  year: ["Год издания", "Год"],
  publisher: ["Издательство"],
  category: ["Рубрика"],
  genre: ["Жанр"],
  annotation: ["Аннотация"],
  rack: ["Шкаф №", "Шкаф"],
  shelf: ["Полка №", "Полка"],
  inventoryNumber: [
    "Инвентарный номер / шифр",
    "Инвентарный номер",
    "Шифр",
  ],
  pdfFileName: ["Имя PDF-файла", "Имя PDF файла"],
} as const;

type Field = keyof typeof headerAliases;

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .toLocaleLowerCase("ru-RU")
    .replace(/[^a-zа-яё0-9]/gi, "");
}

type Props = {
  existingBooks: Book[];
  onImport: (books: Book[]) => void;
  onReset: () => void;
};

export default function ImportPanel({
  existingBooks,
  onImport,
  onReset,
}: Props) {
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreview([]);
    setParseErrors([]);
    setMessage("");

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: false,

      complete: (result) => {
        const headers = result.meta.fields ?? [];

        const headerMap = {} as Record<Field, string | undefined>;

        (Object.keys(headerAliases) as Field[]).forEach((field) => {
          const aliases = headerAliases[field].map(normalizeHeader);
          headerMap[field] = headers.find((header) =>
            aliases.includes(normalizeHeader(header)),
          );
        });

        const missingRequired: string[] = [];

        if (!headerMap.id) missingRequired.push("ID записи");
        if (!headerMap.title) missingRequired.push("Название");

        const csvErrors = result.errors.map((error) => error.message);

        if (missingRequired.length > 0) {
          setParseErrors([
            `В таблице не найдены обязательные колонки: ${missingRequired.join(", ")}.`,
            ...csvErrors,
          ]);
          return;
        }

        const rows: PreviewRow[] = [];

        result.data.forEach((rawRow, index) => {
          const row = rawRow as Record<string, string>;

          // Пустые строки таблицы пропускаем.
          const isEmpty = Object.values(row).every(
            (value) => !String(value ?? "").trim(),
          );
          if (isEmpty) return;

          const value = (field: Field): string => {
            const header = headerMap[field];
            return header ? String(row[header] ?? "").trim() : "";
          };

          const id = value("id");
          const title = value("title");
          const authorsText = value("authors");
          const yearText = value("year");
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!id) errors.push("Не заполнен ID записи.");
          if (!title) errors.push("Не заполнено название.");

          let year: number | undefined;
          if (yearText) {
            if (!/^\d{1,4}$/.test(yearText) || Number(yearText) < 1) {
              errors.push("Год должен быть числом, например 1986.");
            } else {
              year = Number(yearText);
            }
          }

          const book: Book = {
            id,
            title,
            authors: authorsText
              ? authorsText
                  .split(/[|;]/)
                  .map((author) => author.trim())
                  .filter(Boolean)
              : [],
            ...(year !== undefined ? { year } : {}),
            ...(value("publisher")
              ? { publisher: value("publisher") }
              : {}),
            ...(value("category") ? { category: value("category") } : {}),
            ...(value("genre") ? { genre: value("genre") } : {}),
            ...(value("annotation")
              ? { annotation: value("annotation") }
              : {}),
            ...(value("rack") ? { rack: value("rack") } : {}),
            ...(value("shelf") ? { shelf: value("shelf") } : {}),
            ...(value("inventoryNumber")
              ? { inventoryNumber: value("inventoryNumber") }
              : {}),
            ...(value("pdfFileName")
              ? { pdfFileName: value("pdfFileName") }
              : {}),
          };

          rows.push({
            rowNumber: index + 2,
            book,
            errors,
            warnings,
          });
        });

        // Повторяющиеся ID внутри самого CSV — ошибка.
        const idCounts = new Map<string, number>();
        rows.forEach((row) => {
          const id = row.book?.id;
          if (id) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
        });

        rows.forEach((row) => {
          const id = row.book?.id;
          if (id && (idCounts.get(id) ?? 0) > 1) {
            row.errors.push(`ID «${id}» повторяется в файле.`);
          }
        });

        // ID, уже имеющийся в каталоге, означает обновление записи.
        const existingIds = new Set(existingBooks.map((book) => book.id));

        rows.forEach((row) => {
          const id = row.book?.id;
          if (id && existingIds.has(id)) {
            row.warnings.push("Такая запись уже есть: при импорте она обновится.");
          }
        });

        setPreview(rows);
        setParseErrors(csvErrors);
      },
    });
  }

  const validBooks = preview
    .filter((row) => row.book && row.errors.length === 0)
    .map((row) => row.book as Book);

  function applyImport() {
    onImport(validBooks);
    setMessage(`Импортировано записей: ${validBooks.length}.`);
  }

  return (
    <section className="import-panel">
      <h2>Импорт каталога из CSV</h2>
      <p>
        Выберите CSV-файл. Сначала появится проверка; каталог изменится только
        после нажатия кнопки импорта.
      </p>

      <label className="import-file-label">
        Выбрать CSV-файл
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
        />
      </label>

      {fileName && <p className="import-filename">Файл: {fileName}</p>}

      {parseErrors.length > 0 && (
        <div className="import-errors">
          <strong>Проверьте CSV:</strong>
          <ul>
            {parseErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <p>Импорт с ошибками CSV отключён. Исправьте файл и выберите его снова.</p>
        </div>
      )}

      {preview.length > 0 && (
        <>
          <p>
            Строк: {preview.length}. Корректных для импорта: {validBooks.length}.
          </p>

          <div className="import-table-wrap">
            <table className="import-table">
              <thead>
                <tr>
                  <th>Строка</th>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Проверка</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={`${row.rowNumber}-${row.book?.id}`}>
                    <td>{row.rowNumber}</td>
                    <td>{row.book?.id || "—"}</td>
                    <td>{row.book?.title || "—"}</td>
                    <td>
                      {row.errors.length > 0
                        ? row.errors.join(" ")
                        : row.warnings.length > 0
                          ? row.warnings.join(" ")
                          : "Готово"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="button button-primary"
            type="button"
            onClick={applyImport}
            disabled={validBooks.length === 0 || parseErrors.length > 0}
          >
            Импортировать корректные записи
          </button>
        </>
      )}

      {message && <p className="import-success">{message}</p>}

      <button className="button button-secondary" type="button" onClick={onReset}>
        Вернуть демонстрационные книги
      </button>
    </section>
  );
}
