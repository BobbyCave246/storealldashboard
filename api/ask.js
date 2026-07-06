// Vercel serverless function — the AI brain behind the dashboard search bar.
//
// The browser POSTs { question, data } (data = the dashboard's LOCATIONS object,
// which the page already holds in memory). We ask Claude to answer the question
// from that data and return a small, strictly-typed JSON payload the frontend
// renders: a plain-language summary, an optional jump target (an existing
// dashboard panel), and an optional generated visual (KPI tiles / bars / table)
// built in the dashboard's own house style.
//
// The Anthropic API key is read from the ANTHROPIC_API_KEY environment variable
// (set in the Vercel dashboard) — it is never sent to the browser. This endpoint
// also sits behind the same edge password gate as the rest of the site, because
// the browser's Basic-Auth header rides along on the same-origin fetch.

import Anthropic from '@anthropic-ai/sdk';

// Cheap + fast, and plenty for lookup/summarise over a few KB of data.
// Swap to 'claude-sonnet-5' or 'claude-opus-4-8' for deeper analytical answers.
const MODEL = 'claude-haiku-4-5';

// The dashboard's sections (from SECTIONS in index.html). The model picks one of
// these `id`s when it wants to send the user to a full, existing panel.
const SECTIONS = `
Portfolio-wide sections (scope: portfolio — shown across all three sites):
  overview            — Portfolio summary: occupancy, rent, tenure, corp mix across all sites
  portfolio-payments  — Payment methods, autopay trend, collections status & delinquency watch (31+ days)
  acquisition         — How tenants were acquired: marketing source & contact channel
  lead-funnel         — Lead funnel / conversion
  profile             — Customer profile (SiteLink marketing summary)
Per-site sections (scope: site — respect the chosen location):
  occupancy           — Occupancy by unit type, physical/economic occupancy
  tenure              — Length of stay: mean/median tenure, tenure bands
  segmentation        — Corporate vs individual split (units, rent, area, tenure)
  geography           — Where individual tenants come from (parishes / overseas)
  demographics        — Tenant age & gender distribution
  payments            — Payment methods & collection health for this site
`.trim();

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'navigate', 'visual', 'confidence'],
  properties: {
    summary: {
      type: 'string',
      description: 'A clear 1-3 sentence answer to the question, with the key numbers stated plainly.'
    },
    navigate: {
      description: 'An existing dashboard panel to jump the user to, or null if none is a good fit.',
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['loc', 'month', 'section'],
          properties: {
            loc: { type: 'string', description: 'Location key (e.g. central, south, lears). Use central for portfolio-wide sections.' },
            month: { type: ['string', 'null'], description: 'Month key like "2026-06", or null to keep the latest.' },
            section: { type: 'string', description: 'One of the section ids listed in the instructions.' }
          }
        }
      ]
    },
    visual: {
      description: 'An optional generated visual answering the question directly. Use kpis for a few headline numbers, bars to compare a set of values, table for a small grid. Null if the summary alone answers it.',
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'title', 'unit', 'items', 'columns', 'rows'],
          properties: {
            type: { type: 'string', enum: ['kpis', 'bars', 'table'] },
            title: { type: 'string' },
            unit: { type: 'string', description: 'For bars/kpis: "$", "%", or "" (empty). Ignored for table.' },
            items: {
              type: 'array',
              description: 'For kpis and bars. For a table, use [].',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['label', 'value', 'sub'],
                properties: {
                  label: { type: 'string' },
                  value: { type: 'number' },
                  sub: { type: 'string', description: 'Small caption under a KPI tile (kpis only); "" otherwise.' }
                }
              }
            },
            columns: { type: 'array', description: 'For table only; [] otherwise.', items: { type: 'string' } },
            rows: { type: 'array', description: 'For table only; [] otherwise.', items: { type: 'array', items: { type: 'string' } } }
          }
        }
      ]
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
  }
};

function systemPrompt(data) {
  const locKeys = Object.keys(data || {});
  const locLines = locKeys.map(k => {
    const L = data[k];
    const months = Object.keys(L.months || {}).join(', ');
    return `  ${k} — ${L.name} (${L.sub}); months: ${months}`;
  }).join('\n');

  return [
    'You are the search assistant embedded in the Store All Barbados internal data dashboard.',
    'You answer questions from the dashboard data provided below. Store All is a self-storage operator with three sites in Barbados. All money is in Barbadian dollars (BBD).',
    '',
    'Locations available (use these exact keys for `loc`):',
    locLines,
    '',
    'Dashboard sections you can send the user to (use the id for `navigate.section`):',
    SECTIONS,
    '',
    'Guidance:',
    '- Answer only from the DATA below. If the data does not contain the answer, say so in the summary and set visual to null.',
    '- Always write a plain-language `summary` with the actual figures. Lead with the answer.',
    '- Set `navigate` to the most relevant existing panel so the user can see the full breakdown. Use null only if nothing fits.',
    '- Add a `visual` when it helps the reader see the answer: kpis for 1-4 headline numbers; bars to compare values across sites/categories/methods; table for a small grid. Keep visuals to the data actually asked about. Set visual to null when the summary alone is enough.',
    '- For bars/kpis, `unit` is "$" for money, "%" for percentages, or "" otherwise. Put comparison values in `items` (value is numeric, no symbols). For a table, fill `columns` and `rows` and leave `items` as [].',
    '- "Latest" means the most recent month present for that site.',
    '',
    'DATA (JSON):',
    JSON.stringify(data)
  ].join('\n');
}

export default async function handler(req, res) {
  // Health check — visit /api/ask in the browser to confirm the function is
  // deployed and whether it can see the API key. (No key is exposed.)
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'ok',
      model: MODEL,
      configured: Boolean(process.env.ANTHROPIC_API_KEY)
    });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Search is not configured yet (missing ANTHROPIC_API_KEY).' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const question = (body.question || '').toString().trim();
  const data = body.data;

  if (!question) { res.status(400).json({ error: 'No question provided.' }); return; }
  if (!data || typeof data !== 'object') { res.status(400).json({ error: 'No data provided.' }); return; }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [
        { type: 'text', text: systemPrompt(data), cache_control: { type: 'ephemeral' } }
      ],
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: question }]
    });

    if (response.stop_reason === 'refusal') {
      res.status(200).json({ summary: "I can't answer that one.", navigate: null, visual: null, confidence: 'low' });
      return;
    }

    const textBlock = response.content.find(b => b.type === 'text');
    const parsed = JSON.parse(textBlock.text);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(502).json({ error: 'The search assistant is unavailable right now.', detail: String(err && err.message || err) });
  }
}
