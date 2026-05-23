const knowledgeBase = [
  {
    task: 'Maintain Compensation Grades',
    keywords: ['salary grade', 'pay band', 'compensation setup'],
    module: 'Compensation',
    path: 'Compensation > Compensation Grades',
  },
  {
    task: 'Maintain Absence Plans',
    keywords: ['leave policy', 'absence plan', 'vacation setup'],
    module: 'Absence',
    path: 'Absence > Maintain Absence Plans',
  },
  {
    task: 'Create Integration System User',
    keywords: ['integration user', 'isu'],
    module: 'System',
    path: 'System > Security',
  },
];

function searchKnowledge(userMessage) {
  const msg = String(userMessage || '').toLowerCase();
  return knowledgeBase.find((item) =>
    item.keywords.some((keyword) => msg.includes(keyword.toLowerCase()))
  );
}

export { searchKnowledge };
export default knowledgeBase;
