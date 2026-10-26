/**
 * Food Eagle — Exa web search server.
 *
 * The Angular app is frontend-only (Ionic + Capacitor, no backend), so this is
 * the one server route the web search feature calls. The Exa SDK and the API
 * key live only here: the browser bundle never sees either of them.
 *
 *   EXA_API_KEY=... npm run search-server
 *   POST http://localhost:8787/api/web-search   { "query": "sisig" }
 *
 * The key is read from the environment, or from a local .env file if there is
 * one — it is never accepted from the client and never sent back to it.
 */
import { createServer } from 'node:http';
import Exa from 'exa-js';

const PORT = Number(process.env['PORT'] ?? 8787);
const HOST = process.env['HOST'] ?? '127.0.0.1';
const MAX_QUERY_LENGTH = 300;
const NUM_RESULTS = 5;

// Local development convenience: pick up EXA_API_KEY from .env when present.
try {
  process.loadEnvFile();
} catch {
  // No .env file — the key must come from the real environment.
}

/** User-facing message for each Exa failure the app can actually hit. */
function describeFailure(error) {
  const status = Number(error?.statusCode ?? error?.status);
  if (status === 401) {
    return {
      status: 401,
      code: 'invalid_key',
      message: 'Exa rejected the API key. Check EXA_API_KEY on the server, then try again.',
    };
  }
  if (status === 402) {
    return {
      status: 402,
      code: 'no_credits',
      message: 'The Exa account is out of credits, so the web search is unavailable right now.',
    };
  }
  if (status === 429) {
    return {
      status: 429,
      code: 'rate_limited',
      message: 'Exa is rate limiting this app. Wait a moment and search again.',
    };
  }
  return {
    status: 502,
    code: 'upstream_error',
    message: 'The web search could not be completed. Try again in a moment.',
  };
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    // The Ionic dev server runs on another port, and the app runs on a device
    // as file://, so the local route has to answer cross-origin requests.
    'Access-Control-Allow-Origin': res.req.headers.origin ?? '*',
    'Vary': 'Origin',
  });
  res.end(payload);
}

async function readQuery(req, url) {
  const fromUrl = url.searchParams.get('query') ?? url.searchParams.get('q');
  if (fromUrl !== null) return fromUrl;

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) throw new Error('Payload too large');
  }
  if (!raw.trim()) return '';
  const parsed = JSON.parse(raw);
  return typeof parsed?.query === 'string' ? parsed.query : '';
}

/** One search, with the fields the search screen renders. */
async function runSearch(query) {
  const apiKey = process.env['EXA_API_KEY'];
  if (!apiKey) {
    const error = new Error(
      'EXA_API_KEY is not set on the search server. Add it to your local .env file and restart `npm run search-server`.',
    );
    error.code = 'missing_key';
    error.status = 500;
    throw error;
  }

  const exa = new Exa(apiKey);
  const response = await exa.search(query, {
    type: 'auto',
    numResults: NUM_RESULTS,
    // Highlights are the query-relevant passages — exactly what the card needs,
    // and cheaper than pulling whole pages.
    contents: { highlights: true },
  });

  return (response.results ?? []).map(result => ({
    title: result.title ?? null,
    url: result.url,
    publishedDate: result.publishedDate ?? null,
    author: result.author ?? null,
    // Two passages per result is all the card shows.
    highlights: Array.isArray(result.highlights) ? result.highlights.slice(0, 2) : [],
  }));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': req.headers.origin ?? '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
    });
    res.end();
    return;
  }

  if (url.pathname === '/api/web-search' && (req.method === 'GET' || req.method === 'POST')) {
    try {
      const query = (await readQuery(req, url)).trim();
      if (!query) {
        sendJson(res, 400, {
          code: 'missing_query',
          message: 'Type something to search the web for.',
        });
        return;
      }
      if (query.length > MAX_QUERY_LENGTH) {
        sendJson(res, 400, {
          code: 'query_too_long',
          message: `Web searches are limited to ${MAX_QUERY_LENGTH} characters.`,
        });
        return;
      }

      const results = await runSearch(query);
      sendJson(res, 200, { query, results });
    } catch (error) {
      if (error?.code === 'missing_key') {
        sendJson(res, 500, { code: error.code, message: error.message });
        return;
      }
      if (error instanceof SyntaxError) {
        sendJson(res, 400, { code: 'bad_body', message: 'The search request was not valid JSON.' });
        return;
      }
      const failure = describeFailure(error);
      console.error('[web-search]', failure.code, error?.message ?? error);
      sendJson(res, failure.status, { code: failure.code, message: failure.message });
    }
    return;
  }

  if (url.pathname === '/api/web-search/health') {
    sendJson(res, 200, { ok: true, keyConfigured: Boolean(process.env['EXA_API_KEY']) });
    return;
  }

  sendJson(res, 404, { code: 'not_found', message: 'Unknown route.' });
});

server.listen(PORT, HOST, () => {
  console.log(`[web-search] listening on http://${HOST}:${PORT}/api/web-search`);
  if (!process.env['EXA_API_KEY']) {
    console.warn('[web-search] EXA_API_KEY is not set — searches will fail until it is.');
  }
});
