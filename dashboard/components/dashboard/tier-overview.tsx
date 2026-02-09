"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIER_NAMES, TIER_FREQUENCIES } from "@/types/source";
import Link from "next/link";

interface TierOverviewProps {
  sourcesByTier: Record<number, number>;
  loading?: boolean;
}

const tierColors: Record<number, string> = {
  1: "bg-red-500/10 text-red-500 border-red-500/20",
  2: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  3: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  4: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  5: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export function TierOverview({ sourcesByTier, loading }: TierOverviewProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tier Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse bg-muted rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const tiers = [1, 2, 3, 4, 5];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tier Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tiers.map((tier) => (
            <Link
              key={tier}
              href={`/sources?tier=${tier}`}
              className="block"
            >
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`${tierColors[tier]} font-mono`}
                  >
                    T{tier}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{TIER_NAMES[tier]}</p>
                    <p className="text-xs text-muted-foreground">
                      {TIER_FREQUENCIES[tier]}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {sourcesByTier[tier] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">sources</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
