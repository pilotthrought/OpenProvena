"use client";
import { useLocale } from "@/lib/locale-context";

const RECENT = [
  { d: "nytimes.com",     s: 82, tier: "HIGH"     },
  { d: "lefigaro.fr",     s: 71, tier: "HIGH"     },
  { d: "sputniknews.com", s: 19, tier: "CRITICAL" },
  { d: "20minutes.fr",    s: 63, tier: "MEDIUM"   },
  { d: "infowars.com",    s:  9, tier: "CRITICAL" },
  { d: "theguardian.com", s: 84, tier: "HIGH"     },
];

const TIER_COLOR: Record<string, string> = {
  HIGH: "#2d6a4f", MEDIUM: "#b5832a", LOW: "#c0392b", CRITICAL: "#7b1f1f",
};

export function RecentAnalyses({ onSelect }: { onSelect: (d: string) => void }) {
  const { t } = useLocale();
  return (
    <div className="mt-8 border-t border-rule pt-4">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">
        {t("search.recent")}
      </p>
      {RECENT.map(({ d, s, tier }) => (
        <button
          key={d}
          onClick={() => onSelect(d)}
          className="w-full flex items-center justify-between py-2.5 border-b border-[#f0ede6]
                     hover:bg-white/60 px-1 transition-colors group text-left"
        >
          <span className="font-mono text-[12px] text-ink group-hover:underline">{d}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] font-medium" style={{ color: TIER_COLOR[tier] }}>{s}</span>
            <span className="text-[9px] uppercase tracking-widest" style={{ color: TIER_COLOR[tier] }}>
              {t(`tier.${tier}` as any)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
