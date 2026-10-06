import { describe, it, expect } from 'vitest';
import { outputSize } from './renderQuick';
import type { LoadedImage } from '../../types';

const image = { width: 400, height: 300 } as unknown as LoadedImage;

describe('outputSize', () => {
  it('returns original dimensions without transforms', () => {
    expect(outputSize(image, 0, false, false, null, null)).toEqual({ width: 400, height: 300 });
  });

  it('swaps dimensions on 90 degree rotation', () => {
    expect(outputSize(image, 90, false, false, null, null)).toEqual({ width: 300, height: 400 });
  });

  it('keeps dimensions on 180 degree rotation', () => {
    expect(outputSize(image, 180, false, false, null, null)).toEqual({ width: 400, height: 300 });
  });

  it('honours crop rectangle', () => {
    expect(
      outputSize(image, 0, false, false, { x: 10, y: 10, width: 100, height: 50 }, null),
    ).toEqual({ width: 100, height: 50 });
  });

  it('resize overrides crop and rotation', () => {
    expect(
      outputSize(image, 90, false, false, null, { width: 800, height: 600 }),
    ).toEqual({ width: 800, height: 600 });
  });
});
