import fs from 'fs';
import path from 'path';
import knowledge from '../data/workdayKnowledge.json';

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

const indexFilePath = path.join(process.cwd(), 'src', 'data', 'knowledgeIndex.json');
let indexedKnowledge = null;

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function buildTfidfIndex(items) {
  const documents = items.map((item) =>
    [item.task, item.module, item.path, ...(item.keywords || [])].join(' ')
  );
  const docTokens = documents.map((doc) => tokenize(doc));
  const vocabulary = Array.from(new Set(docTokens.flat()));
  const docCount = documents.length;

  const docFrequencies = vocabulary.map((token) =>
    docTokens.reduce((count, tokens) => (tokens.includes(token) ? count + 1 : count), 0)
  );

  const idf = docFrequencies.map((df) => Math.log((docCount + 1) / (df + 1)) + 1);

  const vectors = docTokens.map((tokens) => {
    const tokenCounts = tokens.reduce((acc, token) => {
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});

    const vector = vocabulary.map((token, index) => {
      const tf = tokenCounts[token] ? tokenCounts[token] / tokens.length : 0;
      return tf * idf[index];
    });

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (magnitude > 0) {
      return vector.map((value) => value / magnitude);
    }
    return vector;
  });

  return {
    vocabulary,
    idf,
    items: items.map((item, index) => ({ ...item, vector: vectors[index] })),
  };
}

function buildQueryVector(index, query) {
  const baseTokens = tokenize(query);
  const queryTokens = expandTokens(String(query || '').toLowerCase(), baseTokens);
  const tokenCounts = queryTokens.reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});

  const vector = index.vocabulary.map((token, i) => {
    const tf = tokenCounts[token] ? tokenCounts[token] / queryTokens.length : 0;
    return tf * index.idf[i];
  });

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude > 0) {
    return vector.map((value) => value / magnitude);
  }
  return vector;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function buildIndex() {
  if (indexedKnowledge) {
    return indexedKnowledge;
  }

  if (fs.existsSync(indexFilePath)) {
    const file = fs.readFileSync(indexFilePath, 'utf-8');
    indexedKnowledge = JSON.parse(file);
    return indexedKnowledge;
  }

  indexedKnowledge = buildTfidfIndex(knowledge);
  return indexedKnowledge;
}

export async function semanticSearch(query) {
  const index = await buildIndex();
  let best = null;
  let bestScore = -1;

  const queryVector = buildQueryVector(index, query);

  for (const item of index.items) {
    const score = cosineSimilarity(queryVector, item.vector);
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
  const queryVector = buildQueryVector(index, query);

  return index.items
    .map((item) => ({ item, score: cosineSimilarity(queryVector, item.vector) }))
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
