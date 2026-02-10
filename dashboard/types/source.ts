export type SourceType =
  | "official_gazette"
  | "ministry"
  | "regulator"
  | "court"
  | "tribunal"
  | "blog"
  | "legal_news"
  | "advocacy"
  | "think_tank"
  | "research"
  | "academic"
  | "international_regulator"
  | "international_advocacy"
  | "international_news"
  | "industry_body"
  | "law_firm"
  | "news"
  | "business_news"
  | "government"
  | "self_regulatory";

export type SourceMethod = "rss" | "webfetch" | "websearch";

export interface Section {
  name: string;
  url: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  rss?: string;
  type: SourceType;
  method: SourceMethod;
  sections?: Section[];
  filter_keywords?: string[];
  search_query?: string;
  keywords?: string[];
  focus_areas: string[];
  enabled: boolean;
  critical?: boolean;
  priority_score?: number;
  blocklisted?: boolean;
  last_fetch?: string;
  last_error?: string;
  // Added by loader (for JSON-based sources)
  tier?: number;
  _file?: string;
}

export interface SourceConfig {
  tier: number;
  name: string;
  check_frequency: string;
  description: string;
  source_count: number;
  sources: Source[];
}

export const TIER_NAMES: Record<number, string> = {
  1: "Critical",
  2: "High Priority",
  3: "Standard",
  4: "Regular",
  5: "Periodic",
};

export const TIER_FREQUENCIES: Record<number, string> = {
  1: "Every run",
  2: "Daily",
  3: "Daily",
  4: "Weekly",
  5: "Monthly",
};
