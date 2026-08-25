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

const STATUS_FALLBACKS: Record<number, string> = {
  400: 'Requête invalide',
  401: 'Session expirée, veuillez vous reconnecter',
  403: 'Accès refusé',
  404: 'Ressource introuvable',
  409: 'Conflit avec l’état actuel de la ressource',
  500: 'Erreur interne du serveur',
  502: 'Passerelle indisponible',
  503: 'Service indisponible',
};

// The backend returns different error shapes depending on the endpoint:
// plain text, HTML, its default JSON envelope ({timestamp,status,error,path})
// or a JSON body carrying a real "message". Normalize everything into a
// short human-readable sentence so UI toasts stay readable.
function statusFallback(status: number): string {
  return STATUS_FALLBACKS[status] ?? `Requête échouée avec le statut ${status}`;
}

function parseJsonSafe(text: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function shortMessage(value: string): string {
  return value.trim().slice(0, 300);
}

async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = statusFallback(response.status);

  const raw = await extractErrorText(response);
  const text = raw?.trim();
  if (!text) return fallback;

  if (text.startsWith('<')) {
    const title = text.match(/<title>([^<]*)<\/title>/i)?.[1];
    return title?.trim() || fallback;
  }

  if (!text.startsWith('{') && !text.startsWith('[')) {
    return shortMessage(text);
  }

  const data = parseJsonSafe(text);
  if (!data) return fallback;

  if (typeof data.message === 'string' && data.message.trim()) {
    return shortMessage(data.message);
  }
  const mapped = STATUS_FALLBACKS[response.status];
  if (mapped) return mapped;
  if (typeof data.error === 'string' && data.error.trim()) {
    return shortMessage(data.error);
  }
  return fallback;
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
    throw new Error(await extractErrorMessage(response));
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
}
