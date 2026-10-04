import type { ReadingEntry } from "./reading";
import { readingMinutes } from "./reading-statistics";

export type EvolutionBook = Pick<ReadingEntry, "slug" | "title" | "author" | "cover" | "category" | "finishedDate" | "readingTime" | "noteCount">;

export const EVOLUTION_WIDTH = 1200;
export const EVOLUTION_AXIS = 124;
export const EVOLUTION_HEADER_HEIGHT = 90;
const LANES = [0, -1, 1];
const COLUMN_GAP = 16;
const EXPANDED_WEIGHT = 2.8;
const EXPANDED_RADIUS_SCALE = 1.3;

export type EvolutionNode = {
  book: EvolutionBook;
  category: string;
  lane: number;
  x: number;
  y: number;
  radius: number;
};

export type EvolutionYear = { year: string; top: number; bottom: number; categories: string[]; nodes: EvolutionNode[] };
export type EvolutionColumn = { category: string; x: number; width: number };
export type EvolutionLayout = { columns: EvolutionColumn[]; xs: number[]; radii: number[] };

export function evolutionColumns(categories: string[], expanded: string | null = null): EvolutionColumn[] {
  const available = EVOLUTION_WIDTH - EVOLUTION_AXIS - 24 - Math.max(0, categories.length - 1) * COLUMN_GAP;
  const weight = categories.length + (expanded && categories.includes(expanded) ? EXPANDED_WEIGHT - 1 : 0);
  let x = EVOLUTION_AXIS;
  return categories.map((category) => {
    const width = available * (category === expanded ? EXPANDED_WEIGHT : 1) / weight;
    const column = { category, x, width };
    x += width + COLUMN_GAP;
    return column;
  });
}

function laneX(width: number, lane: number, radius: number, expanded = false) {
  return width / 2 + lane * Math.min(expanded ? width * 0.24 : 26, Math.max(0, width / 2 - radius - 6));
}

export function evolutionLayout(year: EvolutionYear, expanded: string | null = null): EvolutionLayout {
  const columns = evolutionColumns(year.categories, expanded);
  const byCategory = new Map(columns.map((column) => [column.category, column]));
  const radii = year.nodes.map((node) => node.radius * (node.category === expanded ? EXPANDED_RADIUS_SCALE : 1));
  return { columns, xs: year.nodes.map((node) => {
    const column = byCategory.get(node.category)!;
    return column.x + laneX(column.width, node.lane, node.radius * (node.category === expanded ? EXPANDED_RADIUS_SCALE : 1), node.category === expanded);
  }), radii };
}

function completionDate(book: EvolutionBook) {
  const date = book.finishedDate;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date ? timestamp : null;
}

/** Dates place nodes vertically; three lanes reserve space for expanded circles in each original category. */
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
    const counts = new Map<string, number>();
    for (const book of entries) counts.set(book.category, (counts.get(book.category) ?? 0) + 1);
    const categories = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b, "zh-CN"));
    const columns = evolutionColumns(categories);
    // Reserve separation for the narrowest possible column, so expansion never creates collisions.
    const minWidth = (EVOLUTION_WIDTH - EVOLUTION_AXIS - 24 - (categories.length - 1) * COLUMN_GAP) / (categories.length + EXPANDED_WEIGHT - 1);
    const occupied = new Map(categories.map((category) => [category, [] as EvolutionNode[]]));
    let previousY = top + 28;
    const nodes: EvolutionNode[] = entries.map((book) => {
      const radius = 4 + Math.min(7, Math.sqrt((readingMinutes(book.readingTime) ?? 0) / 60) * 1.7);
      const desiredY = top + 32 + ((end - completionDate(book)!) / (end - start)) * (bandHeight - 64);
      const prior = occupied.get(book.category)!;
      const lanes = LANES.map((lane) => {
        let y = Math.max(desiredY, previousY + 4);
        const x = laneX(minWidth, lane, radius * EXPANDED_RADIUS_SCALE);
        for (const other of prior) {
          const distance = (radius + other.radius) * EXPANDED_RADIUS_SCALE + 4;
          const dx = lane === other.lane ? 0 : Math.abs(x - laneX(minWidth, other.lane, other.radius * EXPANDED_RADIUS_SCALE));
          if (dx < distance) y = Math.max(y, other.y + Math.sqrt(distance * distance - dx * dx));
        }
        return { lane, y };
      });
      const { lane, y } = lanes.reduce((best, candidate) => candidate.y < best.y ? candidate : best);
      const column = columns.find((item) => item.category === book.category)!;
      const node = { book, category: book.category, lane, radius, y, x: column.x + laneX(column.width, lane, radius) };
      prior.push(node);
      previousY = y;
      return node;
    });
    const bottom = Math.max(top + bandHeight, previousY + 40);
    years.push({ year, top, bottom, categories, nodes });
    top = bottom;
  }
  return { years, undated, datedCount: dated.length, height: Math.max(top, EVOLUTION_HEADER_HEIGHT + 180) };
}
