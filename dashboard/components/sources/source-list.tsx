"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ExternalLink, Rss, Globe, Search as SearchIcon } from "lucide-react";
import { Source } from "@/types/source";

interface SourceListProps {
  sources: Source[];
  loading?: boolean;
  onToggleEnabled?: (sourceId: string, enabled: boolean) => void;
  onSourceClick?: (source: Source) => void;
}

const methodIcons: Record<string, React.ReactNode> = {
  rss: <Rss className="h-4 w-4" />,
  webfetch: <Globe className="h-4 w-4" />,
  websearch: <SearchIcon className="h-4 w-4" />,
};

const tierColors: Record<number, string> = {
  1: "bg-red-500/10 text-red-500 border-red-500/20",
  2: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  3: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  4: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  5: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export function SourceList({
  sources,
  loading,
  onToggleEnabled,
  onSourceClick,
}: SourceListProps) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [enabledFilter, setEnabledFilter] = useState<string>("all");

  const filteredSources = sources.filter((source) => {
    const matchesSearch =
      search === "" ||
      source.name.toLowerCase().includes(search.toLowerCase()) ||
      source.id.toLowerCase().includes(search.toLowerCase());

    const matchesMethod =
      methodFilter === "all" || source.method === methodFilter;

    const matchesEnabled =
      enabledFilter === "all" ||
      (enabledFilter === "enabled" && source.enabled) ||
      (enabledFilter === "disabled" && !source.enabled);

    return matchesSearch && matchesMethod && matchesEnabled;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="h-10 w-64 animate-pulse bg-muted rounded" />
          <div className="h-10 w-32 animate-pulse bg-muted rounded" />
          <div className="h-10 w-32 animate-pulse bg-muted rounded" />
        </div>
        <div className="border rounded-lg">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-16 border-b last:border-0 animate-pulse bg-muted/30"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="rss">RSS</SelectItem>
            <SelectItem value="webfetch">WebFetch</SelectItem>
            <SelectItem value="websearch">WebSearch</SelectItem>
          </SelectContent>
        </Select>
        <Select value={enabledFilter} onValueChange={setEnabledFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredSources.length} of {sources.length} sources
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Tier</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[100px]">Method</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[80px] text-center">Enabled</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No sources found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSources.map((source) => (
                <TableRow
                  key={source.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSourceClick?.(source)}
                >
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${source.tier ? tierColors[source.tier] : ""} font-mono`}
                    >
                      T{source.tier || "?"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {source.id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {methodIcons[source.method]}
                      <span className="text-sm capitalize">{source.method}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize">
                      {source.type.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={(checked) => {
                        onToggleEnabled?.(source.id, checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
