import type { TrustScoreResponse, Tier } from "@/types";
import { useLocale } from "@/lib/locale-context";
import { clsx } from "clsx";

const tierColor: Record<Tier, string> = {
  HIGH:     "text-trust-high",
  MEDIUM:   "text-trust-mid",
  LOW:      "text-trust-low",
  CRITICAL: "text-trust-critical",
};

export function TrustScoreCard({ result }: { result: TrustScoreResponse }) {
  const { t } = useLocale();
  const tier  = result.tier as Tier;
  const color = tierColor[tier] ?? "text-muted";

  return (
    <div className="bg-white border border-rule p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-1">
            {t("trust.source")}
          </p>
          <h1 className="font-serif text-[22px] font-semibold text-[#0a0a0a] leading-tight">
            {result.domain}
          </h1>
          {result.domain_type && <p className="text-xs text-muted mt-1">{result.domain_type}</p>}
          {result.owner       && <p className="text-xs text-muted">{result.owner}</p>}
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-1">
            {t("trust.score")}
          </p>
          <p className={clsx("font-serif text-[52px] font-normal leading-none", color)}>
            {result.trust_score}
          </p>
          <p className={clsx("text-[10px] font-medium tracking-widest uppercase mt-1", color)}>
            {t(`tier.${tier}` as any)}
          </p>
          <p className="font-mono text-[9px] text-muted mt-1">
            {t("trust.confidence")} {(result.confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
