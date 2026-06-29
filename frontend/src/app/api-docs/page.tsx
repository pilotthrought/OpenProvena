"use client";
import { useLocale } from "@/lib/locale-context";

export default function ApiDocsPage() {
  const { t } = useLocale();

  const ENDPOINTS = [
    {
      method: "GET", path: "/v1/trust",
      desc: "Analyze a domain and return its Trust Score with per-signal breakdown.",
      params: [
        { name: "domain",        req: true,  desc: t("api.param") + " : domain (ex: lemonde.fr)" },
        { name: "explain",       req: false, desc: "Include signal breakdown (default: true)" },
        { name: "force_refresh", req: false, desc: "Bypass Redis cache (default: false)" },
      ],
      example: `curl "https://api.openprovena.org/v1/trust?domain=lemonde.fr&explain=true" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      response: `{\n  "domain": "lemonde.fr",\n  "trust_score": 78.4,\n  "confidence": 0.91,\n  "tier": "HIGH",\n  "signals": [ … ],\n  "cached": false\n}`,
    },
    {
      method: "GET", path: "/v1/trust/batch",
      desc: "Analyze up to 20 domains in parallel.",
      params: [{ name: "domains", req: true, desc: "Comma-separated list (max 20)" }],
      example: `curl "https://api.openprovena.org/v1/trust/batch?domains=lemonde.fr,rt.com"`,
      response: `{ "results": [ … ], "count": 2 }`,
    },
    {
      method: "GET", path: "/v1/narratives",
      desc: "List active disinformation narratives.",
      params: [
        { name: "velocity", req: false, desc: "fast | moderate | slow" },
        { name: "trend",    req: false, desc: "rising | stable | declining" },
      ],
      example: `curl "https://api.openprovena.org/v1/narratives?velocity=fast"`,
      response: `{ "items": [ … ], "meta": { "total": 3 } }`,
    },
  ];

  const RATE_LIMITS = [
    { tier: t("api.limits.anonymous"),     limit: "10 req/min",  window: t("api.limits.window_val") },
    { tier: t("api.limits.authenticated"), limit: "60 req/min",  window: t("api.limits.window_val") },
    { tier: t("api.limits.apikey"),        limit: "600 req/min", window: t("api.limits.window_val") },
  ];

  return (
    <div className="px-6 py-8 max-w-[720px] mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-[22px] font-semibold">{t("api.title")}</h1>
        <p className="text-xs text-muted mt-1">{t("api.subtitle")}</p>
      </div>

      <div className="border-t-2 border-ink pt-4 mb-6">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-1">{t("api.base_url")}</p>
        <p className="font-mono text-sm">https://api.openprovena.org</p>
      </div>

      {ENDPOINTS.map(({ method, path, desc, params, example, response }) => (
        <div key={path} className="mb-10">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-xs font-medium text-trust-mid">{method}</span>
            <span className="font-mono text-sm font-medium">{path}</span>
          </div>
          <p className="text-[12px] text-muted mb-3">{desc}</p>
          <table className="w-full text-[11px] mb-3">
            <thead>
              <tr className="border-b border-rule">
                {([t("api.param"), t("api.required"), t("api.description")] as string[]).map((h) => (
                  <th key={h} className="text-left font-mono text-[9px] uppercase tracking-wider text-muted py-1.5 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {params.map((p) => (
                <tr key={p.name} className="border-b border-[#f0ede6]">
                  <td className="py-1.5 pr-4 font-mono">{p.name}</td>
                  <td className="py-1.5 pr-4 font-mono text-muted">{p.req ? "✓" : "—"}</td>
                  <td className="py-1.5 text-muted">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-[#0a0a0a] text-[#f5f4f0] p-4 mb-px font-mono text-[11px] leading-relaxed">
            <p className="text-muted mb-2"># {t("api.example")}</p>
            <pre className="whitespace-pre-wrap">{example}</pre>
          </div>
          <div className="bg-[#0a0a0a] text-[#f5f4f0] p-4 font-mono text-[11px] leading-relaxed">
            <p className="text-muted mb-2">// {t("api.response")}</p>
            <pre className="whitespace-pre-wrap">{response}</pre>
          </div>
        </div>
      ))}

      <div className="border-t border-rule pt-6 mt-4">
        <h2 className="font-serif text-[16px] font-semibold mb-3">{t("api.auth.title")}</h2>
        <p className="text-[12px] text-muted mb-3">{t("api.auth.desc")}</p>
        <div className="bg-[#0a0a0a] text-[#f5f4f0] p-4 font-mono text-[11px] leading-relaxed">
          <pre>{`Authorization: Bearer eyJhbGci…\nX-API-Key: opk_xxxxxxxxxxxxx`}</pre>
        </div>
      </div>

      <div className="border-t border-rule pt-6 mt-6">
        <h2 className="font-serif text-[16px] font-semibold mb-3">{t("api.limits.title")}</h2>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-rule">
              {([t("api.limits.tier"), t("api.limits.limit"), t("api.limits.window")] as string[]).map((h) => (
                <th key={h} className="text-left font-mono text-[9px] uppercase tracking-wider text-muted py-1.5 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RATE_LIMITS.map(({ tier, limit, window }) => (
              <tr key={tier} className="border-b border-[#f0ede6]">
                <td className="py-2 pr-4 font-mono">{tier}</td>
                <td className="py-2 pr-4 font-mono font-medium">{limit}</td>
                <td className="py-2 text-muted">{window}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
