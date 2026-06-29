import type { TrustScoreResponse, SearchResponse, NarrativeItem } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  trust: {
    get: (domain: string, opts?: { explain?: boolean; force?: boolean }) =>
      apiFetch<TrustScoreResponse>(
        `/v1/trust?domain=${encodeURIComponent(domain)}&explain=${opts?.explain ?? true}&force_refresh=${opts?.force ?? false}`
      ),
    batch: (domains: string[]) =>
      apiFetch<{ results: (TrustScoreResponse | { error: string })[]; count: number }>(
        `/v1/trust/batch?domains=${domains.join(",")}&explain=false`
      ),
  },

  search: (q: string, tier?: string) =>
    apiFetch<SearchResponse>(
      `/v1/search?q=${encodeURIComponent(q)}${tier ? `&tier=${tier}` : ""}`
    ),

  narratives: {
    list: (params?: { velocity?: string; trend?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiFetch<{ items: NarrativeItem[]; meta: object }>(`/v1/narratives${qs ? `?${qs}` : ""}`);
    },
  },

  sources: {
    get: (domain: string) => apiFetch<object>(`/v1/sources/${encodeURIComponent(domain)}`),
  },

  health: () => apiFetch<{ status: string; version: string }>("/health"),
};
