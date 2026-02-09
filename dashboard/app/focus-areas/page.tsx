"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Tag, ChevronRight } from "lucide-react";
import { FOCUS_AREAS } from "@/types/item";
import { Source } from "@/types/source";
import { PageContainer } from "@/components/layout/page-container";

const focusAreaCategories: Record<string, string[]> = {
  "Technology Law": [
    "IT-Act",
    "Data-Protection",
    "Artificial-Intelligence",
    "Platform-Regulation",
    "E-Commerce",
    "Fintech",
  ],
  "Telecom Law": [
    "Telecommunications-Act",
    "TRAI-Regulations",
    "Satellite-Communications",
    "5G-Emerging-Tech",
  ],
  "Media & Entertainment": [
    "Broadcasting-OTT",
    "Content-IP",
    "Digital-Media",
  ],
  "Emerging Technology": [
    "Blockchain-Web3",
    "Metaverse",
    "Quantum-Computing",
    "Biotechnology",
    "Drones",
    "Autonomous-Vehicles",
    "Space-Technology",
  ],
  "Gaming & Gambling": ["Online-Gaming", "Gambling-Betting"],
  "Competition & Market": ["Digital-Competition", "E-Commerce-Marketplace"],
  Cybersecurity: ["Cybersecurity", "Critical-Infrastructure"],
  "Cross-Cutting": [
    "Constitutional-Rights",
    "Taxation",
    "Labour-Gig-Economy",
    "Environmental",
    "Accessibility",
    "International-Comparative",
  ],
};

export default function FocusAreasPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch("/api/sources");
        if (response.ok) {
          const data = await response.json();
          setSources(data);
        }
      } catch (error) {
        console.error("Error fetching sources:", error);
      }
    };
    fetchSources();
  }, []);

  // Count sources per focus area
  const getSourceCount = (focusArea: string) => {
    return sources.filter((s) =>
      s.focus_areas?.some(
        (fa) => fa.toLowerCase() === focusArea.toLowerCase() || fa === "all"
      )
    ).length;
  };

  const filteredAreas = FOCUS_AREAS.filter((area) =>
    area.toLowerCase().includes(search.toLowerCase())
  );

  const navigateToFeed = (focusArea: string) => {
    router.push(`/feed?focus_area=${encodeURIComponent(focusArea)}`);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Focus Areas</h1>
          <p className="text-muted-foreground">
            Browse sources and items by TMT legal focus areas
          </p>
        </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search focus areas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {search ? (
        // Search results
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredAreas.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No focus areas found matching &quot;{search}&quot;
            </p>
          ) : (
            filteredAreas.map((area) => (
              <Card
                key={area}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigateToFeed(area)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-medium">{area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {getSourceCount(area)} sources
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        // Categorized view
        <div className="space-y-8">
          {Object.entries(focusAreaCategories).map(([category, areas]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-4">{category}</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {areas.map((area) => {
                  const displayArea = area.replace(/-/g, " ");
                  const matchingArea =
                    FOCUS_AREAS.find(
                      (fa) =>
                        fa.toLowerCase().replace(/[\s-]/g, "") ===
                        area.toLowerCase().replace(/[\s-]/g, "")
                    ) || area;

                  return (
                    <Card
                      key={area}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigateToFeed(matchingArea)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Tag className="h-4 w-4 text-primary" />
                            <span className="font-medium">{displayArea}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {getSourceCount(matchingArea)} sources
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </PageContainer>
  );
}
