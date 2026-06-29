"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";

const SCORE_BUCKETS = [
  { label: "0–20",   value: 8420,  color: "#7b1f1f" },
  { label: "21–40",  value: 14300, color: "#c0392b" },
  { label: "41–60",  value: 22100, color: "#b5832a" },
  { label: "61–80",  value: 28600, color: "#5a9e72" },
  { label: "81–100", value: 10900, color: "#2d6a4f" },
];

const TOP_SIGNALS_KEYS = [
  { key: "signal.ai_content_detection", pct: 34 },
  { key: "signal.bot_amplification",    pct: 28 },
  { key: "signal.citation_quality",     pct: 22 },
  { key: "signal.ownership_transparency", pct: 16 },
] as const;

export default function DashboardPage() {
  const { t } = useLocale();
  const [apiStatus, setApiStatus] = useState<"ok"|"error"|"loading">("loading");

  useEffect(() => {
    api.health()
      .then(() => setApiStatus("ok"))
      .catch(() => setApiStatus("error"));
  }, []);

  const KPIS = [
    { lk: "dashboard.analyses",  value: "2 847", trend: "+12%", up: true  },
    { lk: "dashboard.avg_score", value: "61.4",  trend: t("dashboard.avg_score.sub"), up: null },
    { lk: "dashboard.alerts",    value: "47",    trend: t("dashboard.alerts.sub"), up: false },
    { lk: "dashboard.api_calls", value: "138k",  trend: "",    up: null  },
  ] as const;

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {apiStatus === "error" && (
        <div className="mb-4 border border-trust-low/30 bg-white px-4 py-2 font-mono text-[10px] text-trust-low">
          ⚠ {t("dashboard.api_error")}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-px bg-rule mb-px">
        {KPIS.map(({ lk, value, trend, up }) => (
          <div key={lk} className="bg-white p-5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-1">{t(lk as any)}</p>
            <p className="font-serif text-[28px] font-normal leading-tight">{value}</p>
            {trend && (
              <p className={`text-[11px] mt-1 ${up === true ? "text-trust-high" : up === false ? "text-trust-low" : "text-muted"}`}>
                {up === true ? "↑ " : up === false ? "" : ""}{trend}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Chart + signals */}
      <div className="grid grid-cols-[2fr_1fr] gap-px bg-rule">
        <div className="bg-white p-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-4">
            {t("dashboard.distribution")}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SCORE_BUCKETS} barCategoryGap="20%">
              <XAxis dataKey="label" tick={{ fontFamily:"DM Mono", fontSize:10, fill:"#6b6b6b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily:"DM Mono", fontSize:10, fill:"#6b6b6b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily:"DM Mono", fontSize:11, border:"0.5px solid #d4d0c8" }} cursor={{ fill:"#f5f4f0" }} />
              <Bar dataKey="value" radius={[2,2,0,0]}>
                {SCORE_BUCKETS.map((b) => <Cell key={b.label} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-4">
            {t("dashboard.top_signals")}
          </p>
          {TOP_SIGNALS_KEYS.map(({ key, pct }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-[#f0ede6] last:border-0">
              <span className="text-xs text-[#3a3a3a]">{t(key as any)}</span>
              <span className="font-mono text-xs font-medium text-trust-low">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent table */}
      <div className="bg-white border border-rule mt-px p-6">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-4">
          {t("dashboard.recent")}
        </p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-rule">
              {(["dashboard.table.domain","dashboard.table.score","dashboard.table.tier","dashboard.table.confidence","dashboard.table.analyzed"] as const).map((h) => (
                <th key={h} className="text-left font-mono text-[9px] uppercase tracking-wider text-muted py-2 pr-4">{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["lemonde.fr",    78, "HIGH",    "91%", "2 min"],
              ["rt.com",        21, "CRITICAL","88%", "5 min"],
              ["bbc.co.uk",     85, "HIGH",    "93%", "8 min"],
              ["breitbart.com", 28, "CRITICAL","85%", "12 min"],
              ["mediapart.fr",  69, "MEDIUM",  "79%", "18 min"],
            ].map(([d, s, tier, c, time]) => (
              <tr key={String(d)} className="border-b border-[#f0ede6] hover:bg-off-white/60">
                <td className="py-2.5 pr-4 font-mono">{d}</td>
                <td className="py-2.5 pr-4 font-mono font-medium" style={{ color: Number(s) >= 65 ? "#2d6a4f" : Number(s) >= 40 ? "#b5832a" : "#c0392b" }}>{s}</td>
                <td className="py-2.5 pr-4 font-mono text-[9px] tracking-wider">{t(`tier.${tier}` as any)}</td>
                <td className="py-2.5 pr-4 text-muted">{c}</td>
                <td className="py-2.5 text-muted">{time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
