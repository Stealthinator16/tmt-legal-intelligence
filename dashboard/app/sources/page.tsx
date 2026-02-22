"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { SourceList } from "@/components/sources/source-list";
import { SourceForm } from "@/components/sources/source-form";
import { Source } from "@/types/source";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";

function SourcesContent() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier");

  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string>(tierParam || "all");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("edit");

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      let query = "";
      if (selectedTier === "disabled") {
        query = "?enabled=false";
      } else if (selectedTier !== "all") {
        query = `?tier=${selectedTier}`;
      }
      const response = await fetch(`/api/sources${query}`);
      if (response.ok) {
        const data = await response.json();
        setSources(data);
      }
    } catch (error) {
      console.error("Error fetching sources:", error);
      toast.error("Failed to fetch sources");
    } finally {
      setLoading(false);
    }
  }, [selectedTier]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleToggleEnabled = async (sourceId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setSources((prev) =>
          prev.map((s) => (s.id === sourceId ? { ...s, enabled } : s))
        );
        toast.success(`Source ${enabled ? "enabled" : "disabled"}`);
      } else {
        toast.error("Failed to update source");
      }
    } catch (error) {
      console.error("Error updating source:", error);
      toast.error("Failed to update source");
    }
  };

  const handleSourceClick = (source: Source) => {
    setSelectedSource(source);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleAddSource = () => {
    setSelectedSource(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleSaveSource = async (sourceData: Partial<Source>) => {
    try {
      const isCreate = formMode === "create";
      const url = isCreate
        ? "/api/sources"
        : `/api/sources/${selectedSource?.id}`;
      const method = isCreate ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sourceData),
      });

      if (response.ok) {
        toast.success(`Source ${isCreate ? "created" : "updated"} successfully`);
        setFormOpen(false);
        fetchSources();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save source");
      }
    } catch (error) {
      console.error("Error saving source:", error);
      toast.error("Failed to save source");
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Are you sure you want to delete this source?")) return;

    try {
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Source deleted successfully");
        setFormOpen(false);
        fetchSources();
      } else {
        toast.error("Failed to delete source");
      }
    } catch (error) {
      console.error("Error deleting source:", error);
      toast.error("Failed to delete source");
    }
  };

  const handleToggleBlocklist = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleBlocklist: true }),
      });

      if (response.ok) {
        toast.success("Blocklist updated");
        fetchSources();
      } else {
        toast.error("Failed to update blocklist");
      }
    } catch (error) {
      console.error("Error updating blocklist:", error);
      toast.error("Failed to update blocklist");
    }
  };

  const tierCounts = sources.reduce(
    (acc, source) => {
      if (source.tier) {
        acc[source.tier] = (acc[source.tier] || 0) + 1;
      }
      return acc;
    },
    {} as Record<number, number>
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sources</h1>
            <p className="text-muted-foreground">
              Manage your intelligence sources across all tiers
            </p>
          </div>
          <Button onClick={handleAddSource}>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>

      <Tabs value={selectedTier} onValueChange={setSelectedTier}>
        <TabsList>
          <TabsTrigger value="all">
            All ({sources.length})
          </TabsTrigger>
          {[1, 2, 3, 4, 5].map((tier) => (
            <TabsTrigger key={tier} value={tier.toString()}>
              T{tier} ({tierCounts[tier] || 0})
            </TabsTrigger>
          ))}
          <TabsTrigger value="disabled">
            Disabled
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTier} className="mt-6">
          <SourceList
            sources={sources}
            loading={loading}
            onToggleEnabled={handleToggleEnabled}
            onSourceClick={handleSourceClick}
          />
        </TabsContent>
      </Tabs>

        <SourceForm
          source={selectedSource}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={handleSaveSource}
          onDelete={handleDeleteSource}
          onToggleBlocklist={handleToggleBlocklist}
          mode={formMode}
        />
      </div>
    </PageContainer>
  );
}

function SourcesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function SourcesPage() {
  return (
    <Suspense fallback={<SourcesLoading />}>
      <SourcesContent />
    </Suspense>
  );
}
