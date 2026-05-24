import knowledge from '../data/workdayKnowledge.json';
import { embed, cosineSimilarity } from './semantic';

const aliasMap = {
  'money transaction': ['payment', 'pay', 'salary', 'compensation'],
  'payment history': ['payment', 'pay', 'salary', 'compensation'],
  'pay history': ['pay', 'salary', 'compensation'],
  'salary slip': ['pay', 'salary', 'compensation'],
  payslip: ['pay', 'salary', 'compensation'],
  paystub: ['pay', 'salary', 'compensation'],
  income: ['salary', 'compensation', 'pay'],
  reimbursement: ['compensation', 'pay'],
};

let indexedKnowledge = null;

export async function buildIndex() {
  if (indexedKnowledge) {
    return indexedKnowledge;
  }

  indexedKnowledge = await Promise.all(
    knowledge.map(async (item) => {
      const text = `
${item.task}

${item.keywords.join(' ')}

${item.path}

${item.module}
`;
      const embedding = await embed(text);

      return {
        ...item,
        embedding,
      };
    })
  );

  return indexedKnowledge;
}

export async function semanticSearch(query) {
  const index = await buildIndex();
  const queryEmbedding = await embed(query);
  let best = null;
  let bestScore = -1;

  for (const item of index) {
    const score = cosineSimilarity(queryEmbedding, item.embedding);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  return {
    match: best,
    score: bestScore,
  };
}

export async function semanticSearchTopK(query, limit = 3) {
  const index = await buildIndex();
  const queryEmbedding = await embed(query);

  return index
    .map((item) => ({ item, score: cosineSimilarity(queryEmbedding, item.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function expandTokens(normalizedQuery, tokens) {
  const expanded = new Set(tokens);
  for (const [phrase, synonyms] of Object.entries(aliasMap)) {
    if (normalizedQuery.includes(phrase)) {
      synonyms.forEach((token) => expanded.add(token));
    }
  }

  return Array.from(expanded);
}

export function keywordSearch(query) {
  const matches = keywordSearchAll(query, 1);
  return matches[0] ?? null;
}

export function keywordSearchAll(query, limit = 3) {
  const normalizedQuery = String(query || '').toLowerCase();
  if (!normalizedQuery.trim()) {
    return [];
  }

  const baseTokens = normalizedQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  const queryTokens = expandTokens(normalizedQuery, baseTokens);

  return knowledge
    .map((item) => {
      const haystack = [item.task, item.module, item.path, ...(item.keywords || [])]
        .join(' ')
        .toLowerCase();

      const score = queryTokens.reduce(
        (total, token) => (haystack.includes(token) ? total + 1 : total),
        0
      );

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}
