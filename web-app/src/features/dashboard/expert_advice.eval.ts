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
  it('evaluates web shampoo advice gradient distribution and coverage', () => {
    const webGrad = evaluatePercentageGradient(0, 50, 100);

    expect(webGrad.startPercent).toBe(0);
    expect(webGrad.midPercent).toBe(50);
    expect(webGrad.endPercent).toBe(100);
    expect(webGrad.transitionSpan).toBe(100);
    expect(webGrad.unmaskedRatio).toBe(0);
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
