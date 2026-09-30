import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRIVACY_POLICY,
  DEFAULT_TERMS_OF_USE,
  estimateReadingTimeMinutes,
  formatReadingTime,
  type PrivacyPolicyData,
  type TermsOfUseData,
} from './legal_types';

function evaluatePrivacyStructure(data: PrivacyPolicyData) {
  let score = 0;
  const totalChecks = 6;

  if (data.title && data.title.length > 5) score += 1;
  if (data.breadcrumbs && data.breadcrumbs.length >= 2) score += 1;
  if (data.lastUpdated && data.lastUpdated.includes('2026')) score += 1;
  if (data.summary && data.summary.items.length === 4) score += 1;
  if (data.toc && data.toc.length >= 3) score += 1;
  if (data.sections && data.sections.length >= 3) score += 1;

  return score / totalChecks;
}

function evaluateTermsStructure(data: TermsOfUseData) {
  let score = 0;
  const totalChecks = 7;

  if (data.title && data.title.length > 5) score += 1;
  if (data.breadcrumbs && data.breadcrumbs.length >= 2) score += 1;
  if (data.lastUpdated && data.lastUpdated.includes('2026')) score += 1;
  if (data.summary && data.summary.rules.length === 4) score += 1;
  if (data.toc && data.toc.length >= 5) score += 1;
  if (data.sections && data.sections.length >= 5) score += 1;

  const sectionWithCallout = data.sections.find((s) => s.calloutBox);
  if (
    sectionWithCallout &&
    sectionWithCallout.calloutBox?.text.includes('15 хвилин')
  ) {
    score += 1;
  }

  return score / totalChecks;
}

function evaluateTocAnchorParity(
  toc: { href: string }[],
  sections: { id: string }[]
) {
  const sectionIds = new Set(sections.map((s) => s.id));
  let matched = 0;

  for (const item of toc) {
    const targetId = item.href.replace('#', '');
    if (sectionIds.has(targetId)) {
      matched += 1;
    }
  }

  return toc.length > 0 ? matched / toc.length : 0;
}

function extractAllTextFromPrivacy(data: PrivacyPolicyData): string {
  const chunks: string[] = [data.title, data.summary.title, ...data.summary.items];
  for (const sec of data.sections) {
    chunks.push(sec.title);
    if (sec.intro) chunks.push(sec.intro);
    if (sec.paragraphs) chunks.push(...sec.paragraphs);
    if (sec.subSections) {
      for (const sub of sec.subSections) {
        if (sub.title) chunks.push(sub.title);
        chunks.push(...sub.paragraphs);
        if (sub.listItems) chunks.push(...sub.listItems);
      }
    }
  }
  return chunks.join(' ');
}

function extractAllTextFromTerms(data: TermsOfUseData): string {
  const chunks: string[] = [data.title, data.summary.title];
  for (const rule of data.summary.rules) {
    chunks.push(rule.title, rule.description);
  }
  for (const sec of data.sections) {
    chunks.push(sec.title);
    if (sec.intro) chunks.push(sec.intro);
    if (sec.paragraphs) chunks.push(...sec.paragraphs);
    if (sec.calloutBox) {
      if (sec.calloutBox.title) chunks.push(sec.calloutBox.title);
      chunks.push(sec.calloutBox.text);
    }
    if (sec.listItems) chunks.push(...sec.listItems);
    if (sec.subSections) {
      for (const sub of sec.subSections) {
        if (sub.title) chunks.push(sub.title);
        chunks.push(...sub.paragraphs);
        if (sub.listItems) chunks.push(...sub.listItems);
      }
    }
  }
  return chunks.join(' ');
}

describe('Legal Pages Eval Suite', () => {
  it('evaluates legal structure completeness to 100% threshold', () => {
    const privacyScore = evaluatePrivacyStructure(DEFAULT_PRIVACY_POLICY);
    const termsScore = evaluateTermsStructure(DEFAULT_TERMS_OF_USE);

    expect(privacyScore).toBe(1.0);
    expect(termsScore).toBe(1.0);
  });

  it('evaluates TOC anchor parity to 100% parity with zero orphaned links', () => {
    const privacyParity = evaluateTocAnchorParity(
      DEFAULT_PRIVACY_POLICY.toc,
      DEFAULT_PRIVACY_POLICY.sections
    );
    const termsParity = evaluateTocAnchorParity(
      DEFAULT_TERMS_OF_USE.toc,
      DEFAULT_TERMS_OF_USE.sections
    );

    expect(privacyParity).toBe(1.0);
    expect(termsParity).toBe(1.0);
  });

  it('evaluates reading time estimation algorithm with word boundary metrics', () => {
    expect(estimateReadingTimeMinutes('', 180)).toBe(1);
    expect(estimateReadingTimeMinutes('   ', 180)).toBe(1);

    const test180Words = Array.from({ length: 180 }, (_, i) => `слово${i}`).join(' ');
    expect(estimateReadingTimeMinutes(test180Words, 180)).toBe(1);

    const test181Words = Array.from({ length: 181 }, (_, i) => `слово${i}`).join(' ');
    expect(estimateReadingTimeMinutes(test181Words, 180)).toBe(2);

    expect(formatReadingTime(6)).toBe('6 хв читання');
    expect(formatReadingTime(8)).toBe('8 хв читання');
  });

  it('evaluates reading time metric parity against declared document reading time', () => {
    const privacyText = extractAllTextFromPrivacy(DEFAULT_PRIVACY_POLICY);
    const privacyWords = privacyText.trim().split(/\s+/).length;
    const privacyEstimatedMinutes = estimateReadingTimeMinutes(privacyText, 60);

    expect(privacyWords).toBeGreaterThan(200);
    expect(DEFAULT_PRIVACY_POLICY.readingTime).toBe('6 хв читання');
    expect(privacyEstimatedMinutes).toBeGreaterThanOrEqual(4);
    expect(privacyEstimatedMinutes).toBeLessThanOrEqual(8);

    const termsText = extractAllTextFromTerms(DEFAULT_TERMS_OF_USE);
    const termsWords = termsText.trim().split(/\s+/).length;
    const termsEstimatedMinutes = estimateReadingTimeMinutes(termsText, 60);

    expect(termsWords).toBeGreaterThan(250);
    expect(DEFAULT_TERMS_OF_USE.readingTime).toBe('8 хв читання');
    expect(termsEstimatedMinutes).toBeGreaterThanOrEqual(6);
    expect(termsEstimatedMinutes).toBeLessThanOrEqual(10);
  });

  it('evaluates composite eval score exceeding 95% pass criteria', () => {
    const privacyScore = evaluatePrivacyStructure(DEFAULT_PRIVACY_POLICY);
    const termsScore = evaluateTermsStructure(DEFAULT_TERMS_OF_USE);
    const privacyParity = evaluateTocAnchorParity(
      DEFAULT_PRIVACY_POLICY.toc,
      DEFAULT_PRIVACY_POLICY.sections
    );
    const termsParity = evaluateTocAnchorParity(
      DEFAULT_TERMS_OF_USE.toc,
      DEFAULT_TERMS_OF_USE.sections
    );

    const compositeScore = (privacyScore + termsScore + privacyParity + termsParity) / 4;
    expect(compositeScore).toBeGreaterThanOrEqual(0.95);
    expect(compositeScore).toBe(1.0);
  });
});
