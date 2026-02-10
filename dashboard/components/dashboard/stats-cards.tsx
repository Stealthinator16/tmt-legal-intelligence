"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Rss, FileSearch, Clock } from "lucide-react";
import { DashboardStats } from "@/types/item";

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Sources",
      value: stats?.totalSources ?? 0,
      subtitle: `${stats?.enabledSources ?? 0} enabled`,
      icon: Database,
      color: "text-blue-500",
    },
    {
      title: "New Items",
      value: stats?.newItemsToday ?? 0,
      subtitle: "From latest fetch",
      icon: Rss,
      color: "text-green-500",
    },
    {
      title: "Page Changes",
      value: stats?.pageChanges ?? 0,
      subtitle: "Detected",
      icon: FileSearch,
      color: "text-yellow-500",
    },
    {
      title: "Pending",
      value: stats?.websearchPending ?? 0,
      subtitle: "WebSearch sources",
      icon: Clock,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-20 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
