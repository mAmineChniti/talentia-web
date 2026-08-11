// ============================================================================
// Typed API client core for the Talent-IA Spring Boot backend, built on fetch.
// Calls are proxied through Next.js rewrites (/backend-api/* -> :8089/api/*)
// ============================================================================

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || '/backend-api'
).replace(/\/+$/, '');

type RequestOptions = RequestInit & {
  json?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
};

async function extractErrorText(
  response: Response
): Promise<string | undefined> {
  try {
    return await response.clone().text();
  } catch {
    return undefined;
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { searchParams, json, body, headers, ...rest } = options;

  let url = `${API_BASE}/${path.replace(/^\/+/, '')}`;

  if (searchParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const query = params.toString();
    if (query) url += `?${query}`;
  }

  const init: RequestInit = { ...rest, headers };
  if (json !== undefined) {
    init.body = JSON.stringify(json);
    init.headers = { 'Content-Type': 'application/json', ...headers };
  } else if (body !== undefined) {
    init.body = body;
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new Error(
      Error.isError(error)
        ? error.message
        : 'Impossible de contacter le serveur'
    );
  }

  if (!response.ok) {
    const text = await extractErrorText(response);
    throw new Error(
      text
        ? text.slice(0, 300)
        : `Requête échouée avec le statut ${response.status}`
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
