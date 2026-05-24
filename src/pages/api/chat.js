import Groq from 'groq-sdk';
import {
  keywordSearch,
  keywordSearchAll,
  semanticSearch,
  semanticSearchTopK,
} from '../../lib/searchKnowledge';

function formatOptions(matches) {
  return matches
    .map((item, index) => `${index + 1}. ${item.task} -> ${item.path}`)
    .join('\n');
}

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

  const cleanedMessage = String(message).trim();
  const normalizedMessage = cleanedMessage.toLowerCase();
  const isGreeting = /^(hi|hii|hello|hey|heya|yo|sup|howdy|good\s+(morning|afternoon|evening))\b/.test(
    normalizedMessage
  );
  const isThanks = /\b(thanks|thank you|thx|appreciate it)\b/.test(normalizedMessage);
  const isGoodbye = /\b(bye|goodbye|see you|see ya|later|take care)\b/.test(
    normalizedMessage
  );
  if (isGreeting) {
    return res.status(200).json({
      reply: 'Hi! Tell me the Workday task you want to complete, and I will point you to the right setting.',
    });
  }
  if (isThanks) {
    return res.status(200).json({
      reply: 'You are welcome. If you need anything else in Workday, just ask.',
    });
  }
  if (isGoodbye) {
    return res.status(200).json({
      reply: 'Goodbye! I am here if you need more help with Workday.',
    });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    const result = await semanticSearch(cleanedMessage);
    let matched = result.match;
    if (result.score < 0.55) {
      const keywordMatches = keywordSearchAll(cleanedMessage, 3);
      if (keywordMatches.length > 0) {
        return res.status(200).json({
          reply: `I found a few possible matches. Which one did you mean?\n${formatOptions(
            keywordMatches
          )}`,
        });
      }

      const semanticMatches = await semanticSearchTopK(cleanedMessage, 3);
      if (semanticMatches.length > 0 && semanticMatches[0].score >= 0.25) {
        return res.status(200).json({
          reply: `Not fully sure. Here are the closest matches I found:\n${formatOptions(
            semanticMatches.map((entry) => entry.item)
          )}`,
        });
      }

      matched = keywordSearch(cleanedMessage);
      if (!matched) {
        return res.status(200).json({
          reply:
            "I couldn't confidently identify the Workday setting. Share the goal or module (for example, Time Off, Benefits, or Personal Info) and I will try again.",
        });
      }
    }
    if (matched && result.score >= 0.55) {
      const description = matched.description ? ` ${matched.description}` : '';
      return res.status(200).json({
        reply: `${matched.task}.${description} Path: ${matched.path}`,
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
              content: `You are a Workday assistant.

          Reply in a professional, user-friendly tone.

          Use only provided Workday information.

          Do not invent paths.

          If greeting, thank-you, or goodbye, respond politely and briefly.

          When answering a single match, use this format:
          "<Task> is where you can <brief benefit>. Path: <Path>"

          Format multi-option navigation as "Task -> Path" with no markdown or HTML.`,
        },
        { role: 'system', content: context },
        ...safeHistory,
        { role: 'user', content: cleanedMessage },
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
