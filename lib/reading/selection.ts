/** Deterministic PRNG; callers own seed/clock policy. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Preserve source order for small pools and the existing partial Fisher–Yates sequence. */
export function pickCoveredBooks<T extends { cover?: string }>(books: readonly T[], count: number, seed: number): T[] {
  const pool = books.filter((book) => book.cover);
  if (pool.length <= count) return pool;
  const random = mulberry32(seed);
  for (let index = 0; index < count; index++) {
    const target = index + Math.floor(random() * (pool.length - index));
    [pool[index], pool[target]] = [pool[target], pool[index]];
  }
  return pool.slice(0, count);
}
