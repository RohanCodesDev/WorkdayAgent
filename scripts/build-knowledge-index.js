const fs = require('fs');
const path = require('path');

const knowledgePath = path.join(__dirname, '..', 'src', 'data', 'workdayKnowledge.json');
const outputPath = path.join(__dirname, '..', 'src', 'data', 'knowledgeIndex.json');

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

function main() {
  const knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
  const index = buildTfidfIndex(knowledge);
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`Wrote knowledge index to ${outputPath}`);
}

main();
