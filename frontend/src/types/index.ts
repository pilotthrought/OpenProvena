export interface SignalDetail {
  signal_name:       string;
  normalized_score:  number;
  weight:            number;
  weighted_score:    number;
  detail:            string;
  confidence:        number;
}

export interface TrustScoreResponse {
  domain:        string;
  trust_score:   number;
  confidence:    number;
  tier:          "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  domain_type?:  string;
  country?:      string;
  owner?:        string;
  signals:       SignalDetail[];
  summary?:      string;
  last_analyzed: string;
  cached:        boolean;
  version:       string;
}

export interface NarrativeItem {
  id:            string;
  title:         string;
  description?:  string;
  velocity:      "fast" | "moderate" | "slow";
  trend:         "rising" | "stable" | "declining";
  source_count:  number;
  domain_cluster: string[];
  tags:          string[];
  detected_at:   string;
  updated_at?:   string;
}

export interface SearchResult {
  domain:       string;
  trust_score?: number;
  tier?:        string;
  snippet?:     string;
  score:        number;
}

export interface SearchResponse {
  results:  SearchResult[];
  meta:     { total: number; page: number; per_page: number; pages: number };
  took_ms:  number;
}

export type Tier = "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";

export const TIER_COLOR: Record<Tier, string> = {
  HIGH:     "text-trust-high",
  MEDIUM:   "text-trust-mid",
  LOW:      "text-trust-low",
  CRITICAL: "text-trust-critical",
};

export const TIER_BG: Record<Tier, string> = {
  HIGH:     "bg-trust-high",
  MEDIUM:   "bg-trust-mid",
  LOW:      "bg-trust-low",
  CRITICAL: "bg-trust-critical",
};

export const TIER_LABEL: Record<Tier, string> = {
  HIGH:     "Fiable",
  MEDIUM:   "Modéré",
  LOW:      "Faible fiabilité",
  CRITICAL: "Risque critique",
};

export const SIGNAL_LABELS: Record<string, string> = {
  domain_age:             "Âge du domaine",
  ownership_transparency: "Transparence propriété",
  citation_quality:       "Qualité des citations",
  factcheck_overlap:      "Fact-checks croisés",
  editorial_quality:      "Qualité éditoriale",
  ai_content_detection:   "Contenu IA généré",
  bot_amplification:      "Amplification bot",
  narrative_propagation:  "Propagation narrative",
  security_risk:          "Risque sécurité",
  historical_reliability: "Fiabilité historique",
};
