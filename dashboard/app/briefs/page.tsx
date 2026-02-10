"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  FileText,
  Plus,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";

interface Brief {
  id: string;
  type: "daily" | "weekly" | "monthly";
  filename: string;
  date: string;
  content?: string;
}

const typeLabels = {
  daily: { label: "Daily", color: "text-blue-500", bg: "bg-blue-500/10" },
  weekly: { label: "Weekly", color: "text-green-500", bg: "bg-green-500/10" },
  monthly: { label: "Monthly", color: "text-purple-500", bg: "bg-purple-500/10" },
};

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [briefContent, setBriefContent] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchBriefs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/briefs");
      if (response.ok) {
        const data = await response.json();
        setBriefs(data);
      }
    } catch (error) {
      console.error("Error fetching briefs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefs();
  }, []);

  const viewBrief = async (brief: Brief) => {
    setSelectedBrief(brief);
    setBriefContent(null);
    setViewOpen(true);

    try {
      const response = await fetch(
        `/api/briefs?type=${brief.type}&filename=${brief.filename}`
      );
      if (response.ok) {
        const data = await response.json();
        setBriefContent(data.content);
      }
    } catch (error) {
      console.error("Error loading brief:", error);
      setBriefContent("Error loading brief content");
    }
  };

  const generateBrief = async (type: "daily" | "weekly" | "monthly") => {
    setGenerating(true);
    try {
      const response = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        toast.success(
          "Brief generation would be triggered here. This feature requires Claude API integration."
        );
        fetchBriefs();
      } else {
        toast.error("Failed to generate brief");
      }
    } catch (error) {
      console.error("Error generating brief:", error);
      toast.error("Failed to generate brief");
    } finally {
      setGenerating(false);
    }
  };

  const dailyBriefs = briefs.filter((b) => b.type === "daily");
  const weeklyBriefs = briefs.filter((b) => b.type === "weekly");
  const monthlyBriefs = briefs.filter((b) => b.type === "monthly");

  const BriefList = ({ items }: { items: Brief[] }) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          No briefs found
        </p>
      ) : (
        items.map((brief) => (
          <Card
            key={brief.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => viewBrief(brief)}
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText
                    className={`h-4 w-4 ${typeLabels[brief.type].color}`}
                  />
                  <div>
                    <p className="font-medium">{brief.filename}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{brief.date}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Briefs</h1>
            <p className="text-muted-foreground">
              View and generate intelligence summaries
            </p>
          </div>
          <Button variant="outline" onClick={fetchBriefs} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

      {/* Quick Generate Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate Brief</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => generateBrief("daily")}
              disabled={generating}
            >
              <Plus className="h-4 w-4 mr-2" />
              Daily Brief
            </Button>
            <Button
              variant="outline"
              onClick={() => generateBrief("weekly")}
              disabled={generating}
            >
              <Plus className="h-4 w-4 mr-2" />
              Weekly Brief
            </Button>
            <Button
              variant="outline"
              onClick={() => generateBrief("monthly")}
              disabled={generating}
            >
              <Plus className="h-4 w-4 mr-2" />
              Monthly Brief
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Note: Brief generation requires Claude API integration to
            automatically synthesize intelligence summaries.
          </p>
        </CardContent>
      </Card>

      {/* Briefs List */}
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">
            Daily ({dailyBriefs.length})
          </TabsTrigger>
          <TabsTrigger value="weekly">
            Weekly ({weeklyBriefs.length})
          </TabsTrigger>
          <TabsTrigger value="monthly">
            Monthly ({monthlyBriefs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <BriefList items={dailyBriefs} />
        </TabsContent>
        <TabsContent value="weekly" className="mt-6">
          <BriefList items={weeklyBriefs} />
        </TabsContent>
        <TabsContent value="monthly" className="mt-6">
          <BriefList items={monthlyBriefs} />
        </TabsContent>
      </Tabs>

        {/* Brief View Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText
                  className={`h-5 w-5 ${
                    selectedBrief ? typeLabels[selectedBrief.type].color : ""
                  }`}
                />
                {selectedBrief?.filename}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[70vh]">
              {briefContent ? (
                <div className="prose prose-invert prose-sm max-w-none p-4">
                  <ReactMarkdown>{briefContent}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
