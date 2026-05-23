import knowledge from '@/data/workdayKnowledge.json';
import { embed, cosineSimilarity } from './semantic';

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
