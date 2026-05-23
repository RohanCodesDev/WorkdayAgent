# Workday Starter

A JavaScript Next.js Pages Router boilerplate with Tailwind CSS, a custom Express server, and a Groq-powered chat endpoint.

## Scripts

- `npm run dev` - start the Express + Next.js dev server
- `npm run build` - build the Next.js app
- `npm run start` - run the production server

## Routes

- `/` - starter landing page
- `/api/health` - Express health endpoint
- `/api/chat` - Groq Llama 3 chat endpoint (POST)

## Environment

Create `.env.local` in the project root:

```
GROQ_API_KEY=your_groq_key
# Optional: override model
# GROQ_MODEL=llama-3.1-8b-instant
```
