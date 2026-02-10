export interface FeedItem {
  title: string;
  url: string;
  published: string;
  snippet: string;
  focus_areas: string[];
  source_id: string;
  source_name: string;
  method: "rss" | "webfetch" | "websearch";
}

export interface NotableLink {
  text: string;
  url: string;
}

export interface PageChange {
  source_id: string;
  source_name: string;
  section: string;
  url: string;
  change_detected: boolean;
  notable_links: NotableLink[];
  last_checked: string;
}

export interface FetchStats {
  total_sources: number;
  successful: number;
  failed: number;
  total_items: number;
  new_items: number;
}

export interface PageMonitorStats {
  total_pages: number;
  successful: number;
  failed: number;
  changes_detected: number;
}

export interface NewItemsData {
  fetched_at: string;
  tiers: number[];
  stats: FetchStats;
  new_items_count: number;
  items: FeedItem[];
  page_changes: PageChange[];
  websearch_pending: string[];
  page_monitor_stats: PageMonitorStats;
}

export interface DashboardStats {
  totalSources: number;
  enabledSources: number;
  sourcesByTier: Record<number, number>;
  sourcesByMethod: Record<string, number>;
  newItemsToday: number;
  totalItems: number;
  pageChanges: number;
  websearchPending: number;
  lastFetchedAt: string | null;
}

export interface SeenItem {
  url: string;
  title: string;
  source_id: string;
  content_hash: string;
  first_seen: string;
  published: string;
}

export const FOCUS_AREAS = [
  "IT-Act",
  "Data-Protection",
  "DPDP-Act",
  "AI-Regulations",
  "Platform-Regulation",
  "E-Commerce",
  "Fintech",
  "Digital-Payments",
  "Telecommunications-Act-2023",
  "TRAI-Regulations",
  "Telecom-Licenses",
  "Spectrum",
  "Net-Neutrality",
  "5G",
  "Satellite",
  "Broadcasting-OTT",
  "Content-Moderation",
  "IP-Copyright",
  "Cybersecurity",
  "Data-Breach",
  "Blockchain-Crypto",
  "Competition-Antitrust",
  "Digital-Markets",
  "Consumer-Protection",
  "Constitutional-Rights",
  "Privacy",
  "Surveillance",
  "Free-Speech",
  "Drones-eVTOL",
  "Space-Technology",
  "Gaming",
  "International-Comparative",
] as const;

export type FocusArea = typeof FOCUS_AREAS[number];
