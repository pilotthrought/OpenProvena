"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import type { NarrativeItem } from "@/types";

const VELOCITY_COLOR: Record<string, string> = { fast: "#c0392b", moderate: "#b5832a", slow: "#5a9e72" };
const TREND_ICON: Record<string, string> = { rising: "↑", stable: "→", declining: "↓" };

export default function NarrativesPage() {
  const { t } = useLocale();
  const [items, setItems]   = useState<NarrativeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]  = useState("all");

  useEffect(() => {
    api.narratives.list()
      .then((r) => setItems(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? items : items.filter((n) => n.velocity === filter);

  const FILTERS = [
    { k: "all",      lk: "narratives.filter.all"      },
    { k: "fast",     lk: "narratives.filter.fast"     },
    { k: "moderate", lk: "narratives.filter.moderate" },
    { k: "slow",     lk: "narratives.filter.slow"     },
  ] as const;

  return (
    <div className="px-6 py-8 max-w-[720px] mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-[22px] font-semibold">{t("narratives.title")}</h1>
        <p className="text-xs text-muted mt-1">{t("narratives.subtitle")}</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-rule pb-3">
        {FILTERS.map(({ k, lk }) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors
              ${filter === k ? "bg-ink text-off-white" : "border border-rule text-muted hover:text-ink"}`}>
            {t(lk)}
          </button>
        ))}
      </div>

      {loading && (
        <p className="font-mono text-xs text-muted animate-pulse py-8 text-center">
          {t("narratives.loading")}
        </p>
      )}

      <div className="space-y-px">
        {filtered.map((n) => {
          const color = VELOCITY_COLOR[n.velocity] ?? "#6b6b6b";
          const trend = TREND_ICON[n.trend] ?? "→";
          return (
            <div key={n.id} className="bg-white border border-rule p-5 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-6">
                  <h2 className="font-serif text-[16px] font-semibold leading-snug">{n.title}</h2>
                  <p className="font-mono text-[9px] uppercase tracking-widest mt-1" style={{ color }}>
                    {t(`narratives.velocity.${n.velocity}` as any)} {trend}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-serif text-[26px] font-normal" style={{ color }}>{n.source_count}</p>
                  <p className="text-[9px] text-muted font-mono">{t("narratives.sources")}</p>
                </div>
              </div>
              {n.description && (
                <p className="text-[12px] text-muted leading-relaxed border-l-2 pl-3" style={{ borderColor: color }}>
                  {n.description}
                </p>
              )}
              {n.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {n.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-[#f0ede6] text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="font-mono text-[9px] text-muted mt-3">
                {t("narratives.detected")} {new Date(n.detected_at).toLocaleDateString()}
                {n.updated_at && ` · ${t("narratives.updated")} ${new Date(n.updated_at).toLocaleDateString()}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
