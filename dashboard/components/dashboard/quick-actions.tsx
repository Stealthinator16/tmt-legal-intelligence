"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, FileText, Zap, Clock } from "lucide-react";
import Link from "next/link";

interface QuickActionsProps {
  loading?: boolean;
}

export function QuickActions({
  loading,
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/fetch?tier=1">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col gap-2"
              disabled={loading}
            >
              <Zap className="h-5 w-5 text-red-500" />
              <span className="text-xs">Fetch Tier 1</span>
            </Button>
          </Link>
          <Link href="/fetch">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col gap-2"
              disabled={loading}
            >
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <span className="text-xs">Fetch All</span>
            </Button>
          </Link>
          <Link href="/briefs?action=generate">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col gap-2"
              disabled={loading}
            >
              <FileText className="h-5 w-5 text-green-500" />
              <span className="text-xs">Generate Brief</span>
            </Button>
          </Link>
          <Link href="/monitor">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col gap-2"
              disabled={loading}
            >
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-xs">View Changes</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
