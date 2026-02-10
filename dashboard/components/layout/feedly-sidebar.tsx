"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Newspaper,
  Star,
  AlertTriangle,
  Plus,
  Settings,
  RefreshCw,
  Rss,
  Globe,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SidebarSource {
  id: string;
  name: string;
  tier: number;
  method: string;
  enabled: boolean;
  blocklisted: boolean;
  hasError: boolean;
  unreadCount: number;
}

interface SidebarData {
  todayCount: number;
  unreadCount: number;
  starredCount: number;
  sourcesByTier: Record<number, SidebarSource[]>;
  sourcesWithErrors: string[];
}

const TIER_LABELS: Record<number, string> = {
  1: "Critical",
  2: "High Priority",
  3: "Standard",
  4: "Regular",
  5: "Periodic",
};

const METHOD_ICONS: Record<string, typeof Rss> = {
  rss: Rss,
  webfetch: Globe,
  websearch: Search,
};

export function FeedlySidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSource = searchParams.get("source");

  const [data, setData] = useState<SidebarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set([1, 2]));
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchSidebarData();
  }, []);

  async function fetchSidebarData() {
    setLoading(true);
    try {
      const res = await fetch("/api/sidebar", {
        cache: 'no-store'
      });
      if (res.ok) {
        const sidebarData = await res.json();
        setData(sidebarData);
      }
    } catch (error) {
      console.error("Error fetching sidebar data:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleTier(tier: number) {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      return next;
    });
  }

  const isToday = pathname === "/" || pathname === "/feed";
  const isStarred = searchParams.get("starred") === "true";

  return (
    <div className="flex h-screen w-72 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            TL
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">TMT Legal</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={fetchSidebarData}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-2 space-y-2">
          {/* Today / All Items */}
          <Link
            href="/"
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isToday && !isStarred && !currentSource
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Newspaper className="h-4 w-4" />
              <span>Today</span>
            </div>
            {data && data.todayCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {data.todayCount}
              </Badge>
            )}
          </Link>

          {/* Starred */}
          <Link
            href="/?starred=true"
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isStarred
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4" />
              <span>Starred</span>
            </div>
            {data && data.starredCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {data.starredCount}
              </Badge>
            )}
          </Link>

          <Separator className="my-3" />

          {/* Sources by Tier */}
          {data && [1, 2, 3, 4, 5].map((tier) => {
            const sources = data.sourcesByTier[tier] || [];
            if (sources.length === 0) return null;

            const isExpanded = expandedTiers.has(tier);
            const tierUnread = sources.reduce((sum, s) => sum + s.unreadCount, 0);
            const tierErrors = sources.filter((s) => s.hasError).length;

            return (
              <div key={tier} className="mb-1">
                {/* Tier Header */}
                <button
                  onClick={() => toggleTier(tier)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span className="uppercase tracking-wider">{TIER_LABELS[tier]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {tierErrors > 0 && (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    )}
                    {tierUnread > 0 && (
                      <span className="text-muted-foreground">{tierUnread}</span>
                    )}
                  </div>
                </button>

                {/* Sources List */}
                {isExpanded && (
                  <div className="ml-2 mt-0.5 space-y-0.5">
                    {sources.map((source) => {
                      const isActive = currentSource === source.id;
                      const Icon = METHOD_ICONS[source.method] || Rss;

                      return (
                        <Link
                          key={source.id}
                          href={`/?source=${source.id}`}
                          className={cn(
                            "flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {source.hasError ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                            ) : (
                              <Icon className="h-3.5 w-3.5 shrink-0 opacity-50" />
                            )}
                            <span className="truncate">{source.name}</span>
                          </div>
                          {source.unreadCount > 0 && (
                            <Badge
                              variant={isActive ? "default" : "secondary"}
                              className="h-5 px-1.5 text-xs shrink-0 ml-1"
                            >
                              {source.unreadCount}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <Link
          href="/sources"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/sources"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Plus className="h-4 w-4" />
          Manage Sources
        </Link>
        <Link
          href="/fetch"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/fetch"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <RefreshCw className="h-4 w-4" />
          Fetch Sources
        </Link>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="h-4 w-4 hidden dark:block" />
          <span className="dark:hidden">Light Mode</span>
          <span className="hidden dark:inline">Dark Mode</span>
        </button>
      </div>
    </div>
  );
}
