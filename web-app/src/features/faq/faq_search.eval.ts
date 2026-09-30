import { describe, it, expect } from 'vitest';
import { FAQ_ITEMS } from './faq_data';
import type { FaqCategory, FaqItem } from './faq_types';

function getStem(word: string): string {
  const normalized = word.toLowerCase().replace(/[^a-zа-яіїєґ0-9]/gi, '');
  if (normalized.length <= 3) return normalized;
  const endings = [
    'ового',
    'овому',
    'ових',
    'овий',
    'ому',
    'ого',
    'ові',
    'них',
    'ний',
    'ним',
    'ної',
    'на',
    'ну',
    'не',
    'ні',
    'их',
    'ій',
    'ям',
    'ях',
    'ам',
    'ах',
    'ів',
    'ей',
    'ти',
    'ся',
    'сь',
    'а',
    'е',
    'є',
    'и',
    'і',
    'о',
    'у',
    'ю',
    'я',
  ];
  for (const end of endings) {
    if (normalized.endsWith(end) && normalized.length - end.length >= 3) {
      return normalized.slice(0, -end.length);
    }
  }
  return normalized;
}

export function searchFaq(
  query: string,
  category: FaqCategory = 'all',
  items: FaqItem[] = FAQ_ITEMS
): FaqItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery && category === 'all') {
    return items;
  }

  const rawTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const stemmedTokens = rawTokens.map(getStem).filter(Boolean);

  const scored = items
    .filter((item) => category === 'all' || item.category === category)
    .map((item) => {
      let score = 0;
      const qLower = item.question.toLowerCase();
      const aLower = item.answer.toLowerCase();

      if (rawTokens.length === 0) {
        return { item, score: 1 };
      }

      if (qLower.includes(normalizedQuery)) {
        score += 20;
      }
      if (aLower.includes(normalizedQuery)) {
        score += 8;
      }

      let matches = 0;
      for (let i = 0; i < rawTokens.length; i++) {
        const raw = rawTokens[i];
        const stem = stemmedTokens[i];

        const inQ = qLower.includes(raw) || qLower.includes(stem);
        const inA = aLower.includes(raw) || aLower.includes(stem);

        if (inQ) {
          score += 5;
          matches++;
        } else if (inA) {
          score += 2;
          matches++;
        }
      }

      if (matches === rawTokens.length) {
        score += 15;
      }

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((entry) => entry.item);
}

export interface EvalTestCase {
  query: string;
  category: FaqCategory;
  expectedTopId: string;
  expectedRelevantIds: string[];
}

export const EVAL_TEST_CASES: EvalTestCase[] = [
  {
    query: 'перший візит',
    category: 'all',
    expectedTopId: 'prep-first-visit',
    expectedRelevantIds: ['prep-first-visit'],
  },
  {
    query: 'підготувати собаку',
    category: 'grooming',
    expectedTopId: 'prep-first-visit',
    expectedRelevantIds: ['prep-first-visit'],
  },
  {
    query: 'вартість комплексного грумінгу',
    category: 'all',
    expectedTopId: 'full-grooming-included',
    expectedRelevantIds: ['full-grooming-included'],
  },
  {
    query: 'присутнім під час стрижки',
    category: 'grooming',
    expectedTopId: 'presence-during-cut',
    expectedRelevantIds: ['presence-during-cut'],
  },
  {
    query: 'озонова ванна',
    category: 'spa',
    expectedTopId: 'spa-ozone-bath',
    expectedRelevantIds: ['spa-ozone-bath'],
  },
  {
    query: 'гіпоалергенна косметика',
    category: 'spa',
    expectedTopId: 'spa-cosmetics',
    expectedRelevantIds: ['spa-cosmetics'],
  },
  {
    query: 'послуга Pet-трансферу',
    category: 'all',
    expectedTopId: 'pet-transfer-how-it-works',
    expectedRelevantIds: ['pet-transfer-how-it-works'],
  },
  {
    query: 'безпека котів',
    category: 'transfer',
    expectedTopId: 'pet-transfer-safety',
    expectedRelevantIds: ['pet-transfer-safety'],
  },
  {
    query: 'накопичувати бонуси',
    category: 'payment',
    expectedTopId: 'bonus-earn-spend',
    expectedRelevantIds: ['bonus-earn-spend'],
  },
  {
    query: 'способи оплати',
    category: 'all',
    expectedTopId: 'payment-methods-available',
    expectedRelevantIds: ['payment-methods-available'],
  },
];

describe('FAQ Search Eval Suite', () => {
  it('achieves 100% precision@1 on benchmark query evaluation set', () => {
    let top1Hits = 0;

    for (const testCase of EVAL_TEST_CASES) {
      const results = searchFaq(testCase.query, testCase.category);
      if (results.length > 0 && results[0].id === testCase.expectedTopId) {
        top1Hits++;
      }
    }

    const precisionAt1 = top1Hits / EVAL_TEST_CASES.length;
    expect(precisionAt1).toBe(1.0);
  });

  it('evaluates Mean Reciprocal Rank (MRR) to be 1.0', () => {
    let reciprocalRankSum = 0;

    for (const testCase of EVAL_TEST_CASES) {
      const results = searchFaq(testCase.query, testCase.category);
      const rank = results.findIndex((r) => r.id === testCase.expectedTopId);
      if (rank !== -1) {
        reciprocalRankSum += 1 / (rank + 1);
      }
    }

    const mrr = reciprocalRankSum / EVAL_TEST_CASES.length;
    expect(mrr).toBe(1.0);
  });

  it('evaluates Recall@2 to encompass all relevant items', () => {
    let recallSum = 0;

    for (const testCase of EVAL_TEST_CASES) {
      const results = searchFaq(testCase.query, testCase.category);
      const top2Ids = results.slice(0, 2).map((r) => r.id);
      const relevantFound = testCase.expectedRelevantIds.filter((id) =>
        top2Ids.includes(id)
      ).length;
      recallSum += relevantFound / testCase.expectedRelevantIds.length;
    }

    const meanRecall = recallSum / EVAL_TEST_CASES.length;
    expect(meanRecall).toBe(1.0);
  });
});
