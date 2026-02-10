"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, Tag } from "lucide-react";
import { FeedItem } from "@/types/item";
import { format, isValid } from "date-fns";

interface ItemCardProps {
  item: FeedItem;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
            </a>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-normal">
                {item.source_name}
              </Badge>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{(() => { const d = new Date(item.published); return isValid(d) ? format(d, "MMM d, yyyy") : "Unknown"; })()}</span>
              </div>
            </div>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon" className="shrink-0">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </CardHeader>
      {(item.snippet || item.focus_areas.length > 0) && (
        <CardContent className="pt-0">
          {item.snippet && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {item.snippet}
            </p>
          )}
          {item.focus_areas.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {item.focus_areas.slice(0, 4).map((area) => (
                <Badge
                  key={area}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {area}
                </Badge>
              ))}
              {item.focus_areas.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{item.focus_areas.length - 4} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
