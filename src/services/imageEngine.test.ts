import { describe, it, expect } from 'vitest';
import {
  buildCssFilter,
  hasPixelAdjustments,
  applyPixelAdjustments,
  applySharpen,
  resizedSize,
} from './imageEngine';
import { DEFAULT_ADJUSTMENTS, type Adjustments } from '../types';

const adj = (patch: Partial<Adjustments>): Adjustments => ({ ...DEFAULT_ADJUSTMENTS, ...patch });

function imageData(pixels: number[][], width = pixels.length): ImageData {
  const data = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach((p, i) => {
    data[i * 4] = p[0];
    data[i * 4 + 1] = p[1];
    data[i * 4 + 2] = p[2];
    data[i * 4 + 3] = p[3] ?? 255;
  });
  return {
    data,
    width,
    height: pixels.length / width,
    colorSpace: 'srgb',
  } as unknown as ImageData;
}

describe('buildCssFilter', () => {
  it('returns none with default adjustments', () => {
    expect(buildCssFilter(DEFAULT_ADJUSTMENTS)).toBe('none');
  });

  it('emits the expected filters', () => {
    const result = buildCssFilter(adj({ brightness: 50, contrast: 20, blur: 4, hue: 90, grayscale: 100 }));
    expect(result).toContain('brightness(1.5)');
    expect(result).toContain('contrast(1.2)');
    expect(result).toContain('blur(4px)');
    expect(result).toContain('hue-rotate(90deg)');
    expect(result).toContain('grayscale(100%)');
  });
});

describe('hasPixelAdjustments', () => {
  it('is false for defaults and true with exposure', () => {
    expect(hasPixelAdjustments(DEFAULT_ADJUSTMENTS)).toBe(false);
    expect(hasPixelAdjustments(adj({ exposure: 10 }))).toBe(true);
    expect(hasPixelAdjustments(adj({ temperature: -5 }))).toBe(true);
  });
});

describe('applyPixelAdjustments', () => {
  it('doubles brightness with exposure +100', () => {
    const img = imageData([[100, 100, 100]]);
    applyPixelAdjustments(img, adj({ exposure: 100 }));
    expect(img.data[0]).toBe(200);
  });

  it('warms colors: raises red, lowers blue', () => {
    const img = imageData([[100, 100, 100]]);
    applyPixelAdjustments(img, adj({ temperature: 100 }));
    expect(img.data[0]).toBeGreaterThan(100);
    expect(img.data[2]).toBeLessThan(100);
  });

  it('spreads channels with vibrance', () => {
    const img = imageData([[120, 100, 100]]);
    applyPixelAdjustments(img, adj({ vibrance: 100 }));
    expect(img.data[0] - img.data[1]).toBeGreaterThan(20);
  });

  it('clamps values within 0..255', () => {
    const img = imageData([[250, 250, 250]]);
    applyPixelAdjustments(img, adj({ exposure: 100, whites: 100 }));
    expect(img.data[0]).toBeLessThanOrEqual(255);
    expect(img.data[0]).toBeGreaterThanOrEqual(0);
  });
});

describe('applySharpen', () => {
  it('does not throw and leaves a flat image unchanged', () => {
    const img = imageData(
      [
        [128, 128, 128],
        [128, 128, 128],
        [128, 128, 128],
        [128, 128, 128],
        [128, 128, 128],
        [128, 128, 128],
        [128, 128, 128],
        [128, 128, 128],
        [128, 128, 128],
      ],
      3,
    );
    applySharpen(img, 50);
    expect(img.data[16]).toBe(128);
  });
});

describe('resizedSize', () => {
  it('caps the longest side to max', () => {
    expect(resizedSize(4000, 2000, 1000)).toEqual({ width: 1000, height: 500 });
  });

  it('never upscales', () => {
    expect(resizedSize(100, 50, 1000)).toEqual({ width: 100, height: 50 });
  });
});
