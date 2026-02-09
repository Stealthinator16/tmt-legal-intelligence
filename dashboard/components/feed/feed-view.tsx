"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  ExternalLink,
  Star,
  Check,
  RefreshCw,
  ChevronRight,
  Circle,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface FeedItem {
  id: number;
  url: string;
  title: string;
  snippet: string;
  source_id: string;
  source_name: string;
  published: string;
  first_seen: string;
  read: boolean;
  starred: boolean;
  focus_areas: string[];
}

interface Source {
  id: string;
  name: string;
  url: string;
  method: "rss" | "webfetch" | "websearch";
  tier?: number;
  last_error?: string;
  last_fetch?: string;
}

interface FetchJob {
  id: string;
  type: "rss" | "page_monitor" | "websearch";
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

interface FeedViewProps {
  className?: string;
}

export function FeedView({ className }: FeedViewProps) {
  const searchParams = useSearchParams();
  const sourceId = searchParams.get("source");
  const isStarred = searchParams.get("starred") === "true";

  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [source, setSource] = useState<Source | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (sourceId) {
        params.set("source", sourceId);
      } else if (isStarred) {
        params.set("starred", "true");
      } else {
        params.set("today", "true");
      }

      params.set("limit", "100");

      const res = await fetch(`/api/items?${params}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  }, [sourceId, isStarred]);

  async function handleRefresh() {
    // If we have a specific source, re-fetch it
    if (sourceId && source) {
      await refreshSource();
    } else {
      // Otherwise just refresh the feed from the database
      fetchItems();
    }
  }

  async function refreshSource() {
    if (!source) return;

    setRefreshing(true);
    const toastId = toast.loading(`Fetching latest from ${source.name}...`);

    try {
      // Map source method to job type
      const jobTypeMap: Record<Source["method"], FetchJob["type"]> = {
        rss: "rss",
        webfetch: "page_monitor",
        websearch: "websearch",
      };

      const jobType = jobTypeMap[source.method];

      // Create fetch job
      const createRes = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: jobType,
          sourceId: source.id,
          tier: source.tier,
        }),
      });

      if (!createRes.ok) {
        throw new Error("Failed to create fetch job");
      }

      const job: FetchJob = await createRes.json();

      // Poll for job completion
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusRes = await fetch(`/api/fetch?id=${job.id}`);
        if (statusRes.ok) {
          const updatedJob: FetchJob = await statusRes.json();

          if (updatedJob.status === "completed") {
            toast.success(`Successfully refreshed ${source.name}`, { id: toastId });
            // Refresh the feed items
            await fetchItems();
            break;
          } else if (updatedJob.status === "failed") {
            throw new Error(updatedJob.error || "Fetch job failed");
          }
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        toast.warning("Fetch is taking longer than expected", { id: toastId });
      }
    } catch (error) {
      console.error("Error refreshing source:", error);
      toast.error(
        `Failed to refresh: ${error instanceof Error ? error.message : "Unknown error"}`,
        { id: toastId }
      );
    } finally {
      setRefreshing(false);
    }
  }

  const fetchSource = useCallback(async () => {
    if (!sourceId) {
      setSource(null);
      return;
    }
    try {
      const res = await fetch(`/api/sources/${sourceId}`);
      if (res.ok) {
        const sourceData = await res.json();
        setSource(sourceData);
      }
    } catch (error) {
      console.error("Error fetching source:", error);
    }
  }, [sourceId]);

  useEffect(() => {
    fetchItems();
    fetchSource();
  }, [fetchItems, fetchSource]);

  async function markRead(itemId: number, read: boolean) {
    try {
      await fetch("/api/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", itemId, value: read }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, read } : item
        )
      );
    } catch (error) {
      console.error("Error marking item as read:", error);
    }
  }

  async function markStarred(itemId: number, starred: boolean) {
    try {
      await fetch("/api/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markStarred", itemId, value: starred }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, starred } : item
        )
      );
    } catch (error) {
      console.error("Error marking item as starred:", error);
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead", sourceId: sourceId || undefined }),
      });
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  function openItem(item: FeedItem) {
    if (!item.read) {
      markRead(item.id, true);
    }
    window.open(item.url, "_blank");
  }

  const title = sourceId
    ? source?.name || "Loading..."
    : isStarred
    ? "Starred Items"
    : "Today";

  const unreadCount = items.filter((i) => !i.read).length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          {sourceId && source?.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-semibold hover:underline flex items-center gap-2 group"
            >
              {title}
              <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ) : (
            <h1 className="text-xl font-semibold">{title}</h1>
          )}
          <p className="text-sm text-muted-foreground">
            {total} items{unreadCount > 0 && ` · ${unreadCount} unread`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <Check className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", (loading || refreshing) && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {source?.last_error && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                Last fetch failed
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                {source.last_error}
              </p>
              {source.last_fetch && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last successful fetch: {formatDistanceToNow(new Date(source.last_fetch), { addSuffix: true })}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="shrink-0"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Item List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Circle className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No items</p>
              <p className="text-sm">
                {sourceId
                  ? "No items from this source"
                  : isStarred
                  ? "No starred items"
                  : "No items in the last 24 hours"}
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group flex cursor-pointer hover:bg-muted/50 transition-colors",
                  !item.read && "bg-primary/5"
                )}
                onClick={() => openItem(item)}
              >
                {/* Unread indicator */}
                <div className="w-1 shrink-0">
                  {!item.read && <div className="h-full bg-primary" />}
                </div>

                <div className="flex-1 p-4 min-w-0">
                  {/* Source and date row */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="font-medium truncate">
                      {item.source_name}
                    </span>
                    <span>·</span>
                    <span title={format(new Date(item.published || item.first_seen), "PPpp")}>
                      {formatDistanceToNow(new Date(item.published || item.first_seen), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className={cn(
                      "text-sm font-medium mb-1 line-clamp-2",
                      item.read && "text-muted-foreground"
                    )}
                  >
                    {item.title}
                  </h3>

                  {/* Snippet */}
                  {item.snippet && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.snippet}
                    </p>
                  )}

                  {/* Tags */}
                  {item.focus_areas.length > 0 && item.focus_areas[0] !== "all" && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.focus_areas.slice(0, 3).map((area) => (
                        <Badge
                          key={area}
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      markStarred(item.id, !item.starred);
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        item.starred && "fill-yellow-500 text-yellow-500"
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.url, "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
