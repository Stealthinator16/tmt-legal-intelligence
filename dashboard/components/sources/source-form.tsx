"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Trash2, Ban } from "lucide-react";
import { Source, SourceMethod, SourceType, TIER_NAMES } from "@/types/source";
import { FOCUS_AREAS } from "@/types/item";

interface SourceFormProps {
  source?: Source | null;
  open: boolean;
  onClose: () => void;
  onSave: (source: Partial<Source>) => void;
  onDelete?: (sourceId: string) => void;
  onToggleBlocklist?: (sourceId: string) => void;
  mode?: "create" | "edit";
}

const sourceTypes: SourceType[] = [
  "official_gazette",
  "ministry",
  "regulator",
  "court",
  "tribunal",
  "blog",
  "legal_news",
  "advocacy",
  "think_tank",
  "research",
  "academic",
  "international_regulator",
  "international_advocacy",
  "international_news",
  "industry_body",
  "law_firm",
  "news",
  "business_news",
  "government",
  "self_regulatory",
];

const sourceMethods: SourceMethod[] = ["rss", "webfetch", "websearch"];

export function SourceForm({
  source,
  open,
  onClose,
  onSave,
  onDelete,
  onToggleBlocklist,
  mode = "edit",
}: SourceFormProps) {
  const [formData, setFormData] = useState<Partial<Source>>(
    source || {
      id: "",
      name: "",
      url: "",
      type: "blog",
      method: "rss",
      tier: 3,
      enabled: true,
      focus_areas: [],
    }
  );
  const [focusAreaInput, setFocusAreaInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addFocusArea = (area: string) => {
    if (area && !formData.focus_areas?.includes(area)) {
      setFormData({
        ...formData,
        focus_areas: [...(formData.focus_areas || []), area],
      });
    }
    setFocusAreaInput("");
  };

  const removeFocusArea = (area: string) => {
    setFormData({
      ...formData,
      focus_areas: formData.focus_areas?.filter((a) => a !== area) || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Source" : "Edit Source"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new source to your intelligence gathering system."
              : "Make changes to the source configuration."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id">Source ID</Label>
                  <Input
                    id="id"
                    value={formData.id || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    placeholder="unique-source-id"
                    disabled={mode === "edit"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Source Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com/feed"
                />
              </div>

              {formData.method === "rss" && (
                <div className="space-y-2">
                  <Label htmlFor="rss">RSS URL (if different)</Label>
                  <Input
                    id="rss"
                    value={formData.rss || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, rss: e.target.value })
                    }
                    placeholder="https://example.com/rss/feed.xml"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: SourceType) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value: SourceMethod) =>
                      setFormData({ ...formData, method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier</Label>
                  <Select
                    value={formData.tier?.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tier: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
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
                </div>
              </div>

              <div className="space-y-2">
                <Label>Focus Areas</Label>
                <div className="flex gap-2">
                  <Select
                    value={focusAreaInput}
                    onValueChange={(value) => addFocusArea(value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add focus area..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FOCUS_AREAS.filter(
                        (area) => !formData.focus_areas?.includes(area)
                      ).map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.focus_areas?.map((area) => (
                    <Badge key={area} variant="secondary" className="gap-1">
                      {area}
                      <button
                        type="button"
                        onClick={() => removeFocusArea(area)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enabled: checked })
                  }
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 flex justify-between">
            <div className="flex gap-2">
              {mode === "edit" && source && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onDelete?.(source.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onToggleBlocklist?.(source.id)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {source.blocklisted ? "Unblock" : "Blocklist"}
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === "create" ? "Add Source" : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
