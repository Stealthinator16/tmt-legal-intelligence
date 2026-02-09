"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";
import { FeedItem } from "@/types/item";
import { formatDistanceToNow } from "date-fns";

interface RecentItemsProps {
  items: FeedItem[];
  loading?: boolean;
}

export function RecentItems({ items, loading }: RecentItemsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-3/4 animate-pulse bg-muted rounded" />
                <div className="h-3 w-1/2 animate-pulse bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Items</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4 pt-0">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent items found
              </p>
            ) : (
              items.map((item, index) => (
                <a
                  key={`${item.source_id}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-xs">
                          {item.source_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.published), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </a>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
