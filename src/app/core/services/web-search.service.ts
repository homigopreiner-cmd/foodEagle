import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/** One page the Exa web search found for the current query. */
export interface WebSearchResult {
  title: string | null;
  url: string;
  publishedDate: string | null;
  author: string | null;
  /** Query-relevant passages from the page (Exa `highlights`). */
  highlights: string[];
}

/** A web-search failure the search screen can show as-is. */
export class WebSearchError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'WebSearchError';
  }
}

/**
 * WebSearchService — the customer search screen's window on the web.
 *
 * The catalogue search stays local (MenuService). Anything *outside* the
 * catalogue comes from Exa, which is called by the small server in
 * `server.mjs`: the SDK and the EXA_API_KEY live there, so this service only
 * ever exchanges a query for plain JSON. Nothing here can see the key.
 */
@Injectable({ providedIn: 'root' })
export class WebSearchService {
  /**
   * Searches the web for `query`.
   *
   * Rejects with a WebSearchError whose message is safe to show the user —
   * a missing key, exhausted credits, a rate limit or an unreachable server
   * are all reported honestly instead of coming back as "no results".
   */
  async search(query: string): Promise<WebSearchResult[]> {
    const term = query.trim();
    if (term.length < 2) return [];

    let response: Response;
    try {
      response = await fetch(environment.webSearchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term }),
      });
    } catch {
      throw new WebSearchError(
        'The web search server is not reachable. Start it with `npm run search-server` and try again.',
        'unreachable',
      );
    }

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload?.message ??
        `The web search failed (HTTP ${response.status}). Try again in a moment.`;
      throw new WebSearchError(message, payload?.code ?? `http_${response.status}`);
    }

    const results = Array.isArray(payload?.results) ? payload.results : [];
    return results
      .filter((result: any) => typeof result?.url === 'string' && result.url)
      .map((result: any) => ({
        title: typeof result.title === 'string' ? result.title : null,
        url: result.url,
        publishedDate: typeof result.publishedDate === 'string' ? result.publishedDate : null,
        author: typeof result.author === 'string' ? result.author : null,
        highlights: Array.isArray(result.highlights)
          ? result.highlights.filter((h: unknown): h is string => typeof h === 'string')
          : [],
      }));
  }
}
