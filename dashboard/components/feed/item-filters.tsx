"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Source } from "@/types/source";
import { FOCUS_AREAS } from "@/types/item";

interface ItemFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  focusAreaFilter: string;
  onFocusAreaFilterChange: (value: string) => void;
  sources: Source[];
  onClearFilters: () => void;
}

export function ItemFilters({
  search,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  focusAreaFilter,
  onFocusAreaFilterChange,
  sources,
  onClearFilters,
}: ItemFiltersProps) {
  const hasFilters = search || sourceFilter !== "all" || focusAreaFilter !== "all";

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {sources.map((source) => (
            <SelectItem key={source.id} value={source.id}>
              {source.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={focusAreaFilter} onValueChange={onFocusAreaFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by focus area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Focus Areas</SelectItem>
          {FOCUS_AREAS.map((area) => (
            <SelectItem key={area} value={area}>
              {area}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
