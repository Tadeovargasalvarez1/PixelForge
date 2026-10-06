import { describe, it, expect } from 'vitest';
import { FILTERS, SIZE_PRESETS, CROP_RATIOS } from './presets';
import { DEFAULT_ADJUSTMENTS } from '../types';

describe('filters', () => {
  it('includes an identity "original" filter', () => {
    const original = FILTERS.find((f) => f.id === 'original');
    expect(original).toBeDefined();
    expect(original?.adjustments).toEqual({});
  });

  it('has unique ids', () => {
    const ids = FILTERS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only sets known adjustment keys', () => {
    const keys = new Set(Object.keys(DEFAULT_ADJUSTMENTS));
    for (const filter of FILTERS) {
      for (const key of Object.keys(filter.adjustments)) {
        expect(keys.has(key)).toBe(true);
      }
    }
  });
});

describe('size presets', () => {
  it('are all positive dimensions', () => {
    for (const preset of SIZE_PRESETS) {
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
    }
  });
});

describe('crop ratios', () => {
  it('starts with free ratio 0', () => {
    expect(CROP_RATIOS[0].id).toBe('free');
    expect(CROP_RATIOS[0].ratio).toBe(0);
  });
});
