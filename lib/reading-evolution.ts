import type { ReadingEntry } from "./reading";
import { readingMinutes } from "./reading-statistics";

export type EvolutionBook = Pick<ReadingEntry, "slug" | "title" | "author" | "cover" | "category" | "finishedDate" | "readingTime" | "noteCount">;

export const READING_GENRES = [
  { name: "文学小说", english: "Literature", categories: ["文学", "精品小说"] },
  { name: "哲学思想", english: "Philosophy", categories: ["哲学宗教"] },
  { name: "心理学", english: "Psychology", categories: ["心理"] },
  { name: "历史社会", english: "History / Society", categories: ["历史", "社会文化"] },
  { name: "科技未来", english: "Science / Tech", categories: ["计算机", "科学技术"] },
  { name: "经济商业", english: "Business", categories: ["经济理财"] },
  { name: "艺术设计", english: "Art / Design", categories: ["艺术"] },
  { name: "其他", english: "Others", categories: [] },
];

export const EVOLUTION_WIDTH = 1200;
export const EVOLUTION_AXIS = 124;
export const EVOLUTION_COLUMN = (EVOLUTION_WIDTH - EVOLUTION_AXIS - 24) / READING_GENRES.length;
export const EVOLUTION_HEADER_HEIGHT = 90;
const LANES = [0, -26, 26];

export type EvolutionNode = {
  book: EvolutionBook;
  genre: number;
  x: number;
  y: number;
  radius: number;
};

export type EvolutionYear = { year: string; top: number; bottom: number; nodes: EvolutionNode[] };

function completionDate(book: EvolutionBook) {
  const date = book.finishedDate;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date ? timestamp : null;
}

/** A deterministic layout: dates place nodes vertically; three lanes avoid collisions within a genre. */
export function readingEvolution(books: EvolutionBook[]) {
  const dated = books.filter((book) => completionDate(book) !== null).sort((a, b) =>
    b.finishedDate!.localeCompare(a.finishedDate!) || a.slug.localeCompare(b.slug)
  );
  const undated = books.filter((book) => completionDate(book) === null);
  const grouped = new Map<string, EvolutionBook[]>();
  for (const book of dated) {
    const year = book.finishedDate!.slice(0, 4);
    const entries = grouped.get(year) ?? [];
    entries.push(book);
    grouped.set(year, entries);
  }
  const years: EvolutionYear[] = [];
  let top = EVOLUTION_HEADER_HEIGHT;
  for (const [year, entries] of grouped) {
    const bandHeight = Math.max(250, entries.length * 8);
    const start = Date.parse(`${year}-01-01`);
    const end = Date.parse(`${Number(year) + 1}-01-01`);
    const occupied = READING_GENRES.map(() => LANES.map(() => -Infinity));
    let previousY = top + 28;
    const nodes: EvolutionNode[] = entries.map((book) => {
      const genreIndex = READING_GENRES.findIndex((genre) => genre.categories.includes(book.category));
      const genre = genreIndex < 0 ? READING_GENRES.length - 1 : genreIndex;
      const radius = 4 + Math.min(7, Math.sqrt((readingMinutes(book.readingTime) ?? 0) / 60) * 1.7);
      const desiredY = top + 32 + ((end - completionDate(book)!) / (end - start)) * (bandHeight - 64);
      let y = Math.max(desiredY, previousY + 4);
      let lane = occupied[genre].findIndex((bottom) => bottom + radius + 5 <= y);
      if (lane < 0) {
        lane = occupied[genre].indexOf(Math.min(...occupied[genre]));
        y = Math.max(y, occupied[genre][lane] + radius + 5);
      }
      occupied[genre][lane] = y + radius;
      previousY = y;
      return { book, genre, radius, y, x: EVOLUTION_AXIS + (genre + 0.5) * EVOLUTION_COLUMN + LANES[lane] };
    });
    const bottom = Math.max(top + bandHeight, previousY + 40);
    years.push({ year, top, bottom, nodes });
    top = bottom;
  }
  return { years, undated, datedCount: dated.length, height: Math.max(top, EVOLUTION_HEADER_HEIGHT + 180) };
}
