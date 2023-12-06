export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

export function toArray<T>(arr: T | T[]): T[] {
  if (Array.isArray(arr)) {
    return arr;
  }

  return [arr];
}
