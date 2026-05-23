import Groq from 'groq-sdk';
import { semanticSearch } from '../../lib/searchKnowledge';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY.' });
  }

  const { message, chatHistory } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    const result = await semanticSearch(message);
    let matched = result.match;
    if (result.score < 0.55) {
      return res.status(200).json({
        reply: "I couldn't confidently identify the Workday setting.",
      });
    }
    const context = matched
      ? `Task:
${matched.task}

Path:
${matched.path}

Module:
${matched.module}`
      : 'No matching Workday data.';

    const safeHistory = Array.isArray(chatHistory)
      ? chatHistory
          .slice(-12)
          .filter(
            (item) =>
              item &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string' &&
              item.content.trim()
          )
          .map((item) => ({ role: item.role, content: item.content.trim() }))
      : [];

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are Workday Navigator.

Help users navigate Workday.

Use provided Workday information.

Do not invent paths.`,
        },
        { role: 'system', content: context },
        ...safeHistory,
        { role: 'user', content: String(message) },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content ?? 'No response generated.';
    return res.status(200).json({ reply });
  } catch (err) {
    const detail = err?.message ?? String(err);
    console.error('/api/chat error:', detail);
    return res.status(500).json({ error: 'Failed to generate reply.', detail });
  }
}
