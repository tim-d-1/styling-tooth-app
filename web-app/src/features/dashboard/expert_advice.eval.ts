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

describe('Expert Advice Shampoo Card Gradient Eval Suite', () => {
  it('evaluates web shampoo advice gradient concentration', () => {
    const webGrad = evaluatePercentageGradient(46, 53, 65);

    expect(webGrad.startPercent).toBe(46);
    expect(webGrad.midPercent).toBe(53);
    expect(webGrad.endPercent).toBe(65);
    expect(webGrad.transitionSpan).toBe(19);
    expect(webGrad.transitionSpan).toBeLessThanOrEqual(20);
    expect(webGrad.unmaskedRatio).toBeGreaterThanOrEqual(0.35);
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
