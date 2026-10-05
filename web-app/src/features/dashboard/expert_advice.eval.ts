import { describe, it, expect } from 'vitest';

export interface GradientEvaluation {
  startPercent: number;
  midPercent: number;
  endPercent: number;
  transitionSpan: number;
  unmaskedRatio: number;
}

export function evaluatePercentageGradient(
  start: number,
  mid: number,
  end: number
): GradientEvaluation {
  return {
    startPercent: start,
    midPercent: mid,
    endPercent: end,
    transitionSpan: end - start,
    unmaskedRatio: (100 - end) / 100,
  };
}

export function evaluateResolutionStops(
  cardWidth: number,
  rightStopStart: number,
  rightStopMid: number,
  rightStopEnd: number,
  imageWidth: number = 148
) {
  const imageLeftEdge = cardWidth - imageWidth;
  const startFromLeft = cardWidth - rightStopStart;
  const midFromLeft = cardWidth - rightStopMid;
  const endFromLeft = cardWidth - rightStopEnd;

  return {
    cardWidth,
    imageLeftEdge,
    startFromLeft,
    midFromLeft,
    endFromLeft,
    precedesImageBorder: startFromLeft <= imageLeftEdge,
    blendsImageBorder: startFromLeft <= imageLeftEdge && midFromLeft >= imageLeftEdge - 10,
    spanPx: rightStopStart - rightStopEnd,
    unmaskedPx: rightStopEnd,
  };
}

describe('Expert Advice Shampoo Card Gradient Eval Suite', () => {
  it('evaluates web shampoo advice gradient concentration on 1024p displays', () => {
    const p1024 = evaluateResolutionStops(306.67, 148, 126, 88);

    expect(p1024.precedesImageBorder).toBe(true);
    expect(p1024.blendsImageBorder).toBe(true);
    expect(p1024.spanPx).toBe(60);
    expect(p1024.startFromLeft / p1024.cardWidth).toBeCloseTo(0.52, 1);
    expect(p1024.endFromLeft / p1024.cardWidth).toBeCloseTo(0.71, 1);
  });

  it('evaluates web shampoo advice gradient concentration on 1440p displays', () => {
    const p1440 = evaluateResolutionStops(365.33, 148, 126, 88);

    expect(p1440.precedesImageBorder).toBe(true);
    expect(p1440.blendsImageBorder).toBe(true);
    expect(p1440.spanPx).toBe(60);
    expect(p1440.unmaskedPx / 148).toBeGreaterThan(0.59);
  });

  it('evaluates mobile shampoo advice gradient concentration', () => {
    const mobileGrad = evaluatePercentageGradient(35, 45, 55);

    expect(mobileGrad.startPercent).toBe(35);
    expect(mobileGrad.midPercent).toBe(45);
    expect(mobileGrad.endPercent).toBe(55);
    expect(mobileGrad.transitionSpan).toBe(20);
    expect(mobileGrad.transitionSpan).toBeLessThanOrEqual(20);
    expect(mobileGrad.unmaskedRatio).toBe(0.45);
  });
});
