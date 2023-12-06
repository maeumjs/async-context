import { chunk } from '#/chunk/chunk';
import { describe, expect, it } from 'vitest';

describe('chunk', () => {
  it('pass', () => {
    const chunks = chunk([1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
    expect(chunks).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);
  });
});
