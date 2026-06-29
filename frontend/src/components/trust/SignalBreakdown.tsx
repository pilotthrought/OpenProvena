"use client";
import type { SignalDetail } from "@/types";
import { useLocale } from "@/lib/locale-context";
import { clsx } from "clsx";

function scoreColor(s: number): string {
  if (s >= 65) return "#2d6a4f";
  if (s >= 40) return "#b5832a";
  return "#c0392b";
}

export function SignalBreakdown({ signals }: { signals: SignalDetail[] }) {
  const { t } = useLocale();
  if (!signals.length) return null;

  const sorted = [...signals].sort((a, b) => a.normalized_score - b.normalized_score);

  return (
    <div className="bg-white border border-rule p-5">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-4">
        {t("trust.signals")}
      </p>
      <div>
        {sorted.map((sig) => {
          const color = scoreColor(sig.normalized_score);
          const label = t(`signal.${sig.signal_name}` as any) || sig.signal_name;
          return (
            <div
              key={sig.signal_name}
              className="flex items-center gap-3 py-2 border-b border-[#f0ede6] last:border-0"
              title={sig.detail}
            >
              <div className="w-[160px] flex-shrink-0">
                <span className="text-[11px] font-medium text-ink">{label}</span>
              </div>
              <div className="flex-1 h-[3px] bg-[#f0ede6] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full score-bar-fill"
                  style={{ width: `${sig.normalized_score}%`, backgroundColor: color }}
                />
              </div>
              <div className="w-8 text-right font-mono text-[11px] font-medium flex-shrink-0" style={{ color }}>
                {sig.normalized_score}
              </div>
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-60"
                style={{ backgroundColor: color }}
                title={`${t("trust.confidence")}: ${(sig.confidence * 100).toFixed(0)}%`}
              />
            </div>
          );
        })}
      </div>
      <p className="font-mono text-[8px] text-muted mt-3 opacity-60">
        {t("trust.hint")}
      </p>
    </div>
  );
}
