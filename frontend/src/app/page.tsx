"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import type { TrustScoreResponse } from "@/types";
import { TrustScoreCard } from "@/components/trust/TrustScoreCard";
import { SignalBreakdown } from "@/components/trust/SignalBreakdown";
import { SearchBar } from "@/components/trust/SearchBar";
import { RecentAnalyses } from "@/components/trust/RecentAnalyses";

const QUICK_DOMAINS = ["lemonde.fr", "rt.com", "mediapart.fr", "breitbart.com", "bbc.co.uk"];

export default function HomePage() {
  const { t } = useLocale();
  const [result, setResult]   = useState<TrustScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const analyze = useCallback(async (domain: string) => {
    if (!domain.trim()) return;
    const clean = domain.replace(/^https?:\/\//, "").split("/")[0].toLowerCase().trim();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.trust.get(clean, { explain: true });
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="px-6 py-8 max-w-[720px] mx-auto">
      <SearchBar onSearch={analyze} loading={loading} initialValue="lemonde.fr" />

      {/* Quick links */}
      <div className="flex gap-3 mt-2 items-center flex-wrap">
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider">{t("search.try")}</span>
        {QUICK_DOMAINS.map((d) => (
          <button key={d} onClick={() => analyze(d)}
            className="font-mono text-[11px] text-ink underline hover:text-muted transition-colors">
            {d}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-10 border border-rule bg-white p-6 text-center">
          <div className="font-mono text-xs text-muted animate-pulse tracking-wider">
            {t("search.loading")}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({length: 10}).map((_, i) => (
              <div key={i} className="h-1 bg-rule rounded animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mt-6 border border-trust-low/30 bg-white p-4">
          <p className="font-mono text-xs text-trust-low">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="mt-8 space-y-px">
          <TrustScoreCard result={result} />
          <SignalBreakdown signals={result.signals} />
          {result.summary && (
            <div className="bg-white border border-rule p-5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">
                {t("trust.analysis")}
              </p>
              <p className="text-[13px] leading-relaxed text-[#3a3a3a] border-l-2 border-rule pl-4">
                {result.summary}
              </p>
              {result.cached && (
                <p className="font-mono text-[9px] text-muted mt-3">
                  ↩ {t("trust.cached")} {new Date(result.last_analyzed).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Default state */}
      {!result && !loading && !error && (
        <>
          <div className="mt-10 border-t border-rule pt-6 grid grid-cols-3 gap-6">
            {[
              { lk: "search.stats.signals",    sk: "search.stats.signals.sub",    v: "10"  },
              { lk: "search.stats.sources",    sk: "search.stats.sources.sub",    v: "84k" },
              { lk: "search.stats.factchecks", sk: "search.stats.factchecks.sub", v: "1.2M"},
            ].map(({ lk, sk, v }) => (
              <div key={lk}>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-1">{t(lk as any)}</p>
                <p className="font-serif text-[28px] font-normal">{v}</p>
                <p className="text-xs text-muted mt-0.5">{t(sk as any)}</p>
              </div>
            ))}
          </div>
          <RecentAnalyses onSelect={analyze} />
        </>
      )}
    </div>
  );
}
