"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Rss,
  FileSearch,
  Search,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { TIER_NAMES } from "@/types/source";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";

interface FetchJob {
  id: string;
  type: "rss" | "page_monitor" | "websearch";
  tier?: number;
  sourceId?: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  output: string[];
  error?: string;
}

const jobTypeInfo = {
  rss: { label: "RSS Feeds", icon: Rss, color: "text-blue-500" },
  page_monitor: { label: "Page Monitor", icon: FileSearch, color: "text-yellow-500" },
  websearch: { label: "WebSearch", icon: Search, color: "text-purple-500" },
};

const statusInfo = {
  pending: { label: "Pending", icon: Clock, color: "text-gray-500", spin: false },
  running: { label: "Running", icon: Loader2, color: "text-blue-500", spin: true },
  completed: { label: "Completed", icon: CheckCircle, color: "text-green-500", spin: false },
  failed: { label: "Failed", icon: XCircle, color: "text-red-500", spin: false },
};

function FetchContent() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier");

  const [jobs, setJobs] = useState<FetchJob[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>(tierParam || "1");
  const [selectedJob, setSelectedJob] = useState<FetchJob | null>(null);
  const pollingRef = useRef(false);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/fetch");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  }, []);

  // Update selected job when jobs change
  useEffect(() => {
    if (selectedJob) {
      const updated = jobs.find((j) => j.id === selectedJob.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedJob)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedJob(updated);
      }
    }
  }, [jobs, selectedJob]);

  // Initial fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobs();
  }, [fetchJobs]);

  // Polling for running jobs
  useEffect(() => {
    const hasRunningJobs = jobs.some((j) => j.status === "running");
    if (hasRunningJobs && !pollingRef.current) {
      pollingRef.current = true;
      const interval = setInterval(fetchJobs, 2000);
      return () => {
        clearInterval(interval);
        pollingRef.current = false;
      };
    }
  }, [jobs, fetchJobs]);

  const startFetch = async (type: FetchJob["type"]) => {
    try {
      const response = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          tier: parseInt(selectedTier),
        }),
      });

      if (response.ok) {
        const job = await response.json();
        setSelectedJob(job);
        toast.success(`${jobTypeInfo[type].label} fetch started`);
        fetchJobs();
        return job;
      } else {
        toast.error("Failed to start fetch");
        return null;
      }
    } catch (error) {
      console.error("Error starting fetch:", error);
      toast.error("Failed to start fetch");
      return null;
    }
  };

  const startFetchAll = async () => {
    toast.loading("Starting all fetches...", { id: "fetch-all" });

    try {
      // Start all three fetch types
      const jobs = await Promise.all([
        startFetch("rss"),
        startFetch("page_monitor"),
        startFetch("websearch"),
      ]);

      const successful = jobs.filter(Boolean).length;
      toast.success(`Started ${successful}/3 fetch types for Tier ${selectedTier}`, {
        id: "fetch-all",
      });
    } catch (error) {
      console.error("Error starting all fetches:", error);
      toast.error("Failed to start all fetches", { id: "fetch-all" });
    }
  };

  const startFetchAllTiers = async () => {
    toast.loading("Starting fetches for all tiers...", { id: "fetch-all-tiers" });

    try {
      const allJobs = [];

      // Start fetches for all 5 tiers
      for (const tier of [1, 2, 3, 4, 5]) {
        const tierJobs = await Promise.all([
          fetch("/api/fetch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "rss", tier }),
          }),
          fetch("/api/fetch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "page_monitor", tier }),
          }),
          fetch("/api/fetch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "websearch", tier }),
          }),
        ]);

        allJobs.push(...tierJobs);
      }

      const successful = allJobs.filter((r) => r.ok).length;
      toast.success(`Started ${successful}/15 fetch jobs across all tiers`, {
        id: "fetch-all-tiers",
      });
      fetchJobs();
    } catch (error) {
      console.error("Error starting all tier fetches:", error);
      toast.error("Failed to start all tier fetches", { id: "fetch-all-tiers" });
    }
  };

  const cancelFetch = async (jobId: string) => {
    try {
      const response = await fetch(`/api/fetch?id=${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Fetch cancelled");
        fetchJobs();
      } else {
        toast.error("Failed to cancel fetch");
      }
    } catch (error) {
      console.error("Error cancelling fetch:", error);
      toast.error("Failed to cancel fetch");
    }
  };

  const runningJob = jobs.find((j) => j.status === "running");

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fetch Data</h1>
            <p className="text-muted-foreground">
              Run fetches to gather new items from your sources
            </p>
          </div>
          <Button
            size="lg"
            onClick={startFetchAllTiers}
            disabled={!!runningJob}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Fetch All Tiers
          </Button>
        </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Start Fetch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Tier</label>
              <div className="flex gap-2">
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((tier) => (
                      <SelectItem key={tier} value={tier.toString()}>
                        Tier {tier} - {TIER_NAMES[tier]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={startFetchAll}
                  disabled={!!runningJob}
                  className="shrink-0"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fetch All
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or fetch individually
                </span>
              </div>
            </div>

            <div className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => startFetch("rss")}
                  disabled={!!runningJob}
                >
                  <Rss className="h-4 w-4 mr-2 text-blue-500" />
                  Fetch RSS Feeds
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => startFetch("page_monitor")}
                  disabled={!!runningJob}
                >
                  <FileSearch className="h-4 w-4 mr-2 text-yellow-500" />
                  Monitor Pages
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => startFetch("websearch")}
                  disabled={!!runningJob}
                >
                  <Search className="h-4 w-4 mr-2 text-purple-500" />
                  WebSearch Sources
                </Button>
              </div>

            {runningJob && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => cancelFetch(runningJob.id)}
              >
                <Square className="h-4 w-4 mr-2" />
                Cancel Running Job
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {selectedJob ? "Job Output" : "Select a Job"}
            </CardTitle>
            {selectedJob && (
              <div className="flex items-center gap-2">
                {(() => {
                  const status = statusInfo[selectedJob.status];
                  const Icon = status.icon;
                  return (
                    <Badge variant="outline" className={status.color}>
                      <Icon
                        className={`h-3 w-3 mr-1 ${
                          status.spin ? "animate-spin" : ""
                        }`}
                      />
                      {status.label}
                    </Badge>
                  );
                })()}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedJob ? (
              <ScrollArea className="h-[400px] rounded-md border bg-muted/30 p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {selectedJob.output.length > 0
                    ? selectedJob.output.join("\n")
                    : selectedJob.status === "running"
                    ? "Waiting for output..."
                    : "No output available"}
                </pre>
                {selectedJob.error && (
                  <div className="mt-4 p-2 bg-red-500/10 text-red-500 rounded text-xs">
                    Error: {selectedJob.error}
                  </div>
                )}
              </ScrollArea>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <p>Start a fetch or select a job from the history below</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Jobs</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchJobs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No fetch jobs yet. Start a fetch above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.slice(0, 10).map((job) => {
                const typeInfo = jobTypeInfo[job.type];
                const status = statusInfo[job.status];
                const TypeIcon = typeInfo.icon;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={job.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedJob?.id === job.id
                        ? "bg-muted border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex items-center gap-3">
                      <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                      <div>
                        <p className="text-sm font-medium">
                          {typeInfo.label}
                          {job.tier && (
                            <span className="text-muted-foreground ml-1">
                              (Tier {job.tier})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.startedAt
                            ? new Date(job.startedAt).toLocaleString()
                            : "Not started"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={status.color}>
                      <StatusIcon
                        className={`h-3 w-3 mr-1 ${
                          status.spin ? "animate-spin" : ""
                        }`}
                      />
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </PageContainer>
  );
}

function FetchLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px] lg:col-span-2" />
      </div>
      <Skeleton className="h-[200px]" />
    </div>
  );
}

export default function FetchPage() {
  return (
    <Suspense fallback={<FetchLoading />}>
      <FetchContent />
    </Suspense>
  );
}
