"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { PageChange } from "@/types/item";
import { PageContainer } from "@/components/layout/page-container";

interface WebSearchPending {
  source_id: string;
  source_name: string;
  query: string;
}

export default function MonitorPage() {
  const [pageChanges, setPageChanges] = useState<PageChange[]>([]);
  const [websearchPending, setWebsearchPending] = useState<WebSearchPending[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/monitor");
      if (response.ok) {
        const data = await response.json();
        setPageChanges(data.page_changes || []);
        setWebsearchPending(data.websearch_pending || []);
      }
    } catch (error) {
      console.error("Error fetching monitor data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const changesDetected = pageChanges.filter((p) => p.change_detected);
  const noChanges = pageChanges.filter((p) => !p.change_detected);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Monitor</h1>
            <p className="text-muted-foreground">
              Track page changes and pending WebSearch sources
            </p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Changes Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {changesDetected.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              No Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {noChanges.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              WebSearch Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {websearchPending.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="changes">
        <TabsList>
          <TabsTrigger value="changes">
            Page Changes ({changesDetected.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            WebSearch Pending ({websearchPending.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Monitored ({pageChanges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="changes" className="mt-6">
          {changesDetected.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No page changes detected in the latest fetch
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {changesDetected.map((page) => (
                <Card key={page.source_id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <h3 className="font-semibold">{page.source_name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {page.url}
                        </p>
                        {page.notable_links && page.notable_links.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">
                              Notable Links Found:
                            </p>
                            <div className="space-y-1">
                              {page.notable_links.slice(0, 5).map((link, i) => (
                                <a
                                  key={i}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {link.text || link.url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Visit
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {websearchPending.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No WebSearch sources pending
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {websearchPending.map((source) => (
                <Card key={source.source_id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <div>
                          <h3 className="font-semibold">{source.source_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Query: {source.query}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-orange-500">
                        Pending
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {pageChanges.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No monitored pages yet. Run a page monitor fetch to start tracking.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pageChanges.map((page) => (
                <Card key={page.source_id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {page.change_detected ? (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <h3 className="font-semibold">{page.source_name}</h3>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {page.url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={
                            page.change_detected
                              ? "text-yellow-500"
                              : "text-green-500"
                          }
                        >
                          {page.change_detected ? "Changed" : "No Change"}
                        </Badge>
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </PageContainer>
  );
}
