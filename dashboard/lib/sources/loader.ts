import fs from "fs/promises";
import path from "path";
import { Source, SourceConfig } from "@/types/source";

const TIER_DIRS: Record<number, string> = {
  1: "tier1-critical",
  2: "tier2-high",
  3: "tier3-standard",
  4: "tier4-regular",
  5: "tier5-periodic",
};

function getConfigPath(): string {
  // In development, config is relative to project root
  const configPath = process.env.SOURCES_CONFIG_PATH || "../sources/config";
  return path.resolve(process.cwd(), configPath);
}

export async function loadSourcesForTier(tier: number): Promise<Source[]> {
  const configPath = getConfigPath();
  const tierDir = TIER_DIRS[tier];

  if (!tierDir) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  const tierPath = path.join(configPath, tierDir);
  const sources: Source[] = [];

  try {
    const files = await fs.readdir(tierPath);

    for (const file of files.filter((f) => f.endsWith(".json"))) {
      const filePath = path.join(tierPath, file);
      const content = await fs.readFile(filePath, "utf-8");
      const config: SourceConfig = JSON.parse(content);

      for (const source of config.sources || []) {
        sources.push({
          ...source,
          tier,
          _file: filePath,
        });
      }
    }
  } catch (error) {
    console.error(`Error loading tier ${tier}:`, error);
  }

  return sources;
}

export async function loadAllSources(): Promise<Source[]> {
  const allSources: Source[] = [];

  for (const tier of [1, 2, 3, 4, 5]) {
    const sources = await loadSourcesForTier(tier);
    allSources.push(...sources);
  }

  return allSources;
}

export async function loadSourceById(id: string): Promise<Source | null> {
  const allSources = await loadAllSources();
  return allSources.find((s) => s.id === id) || null;
}

export async function getSourceStats(): Promise<{
  total: number;
  enabled: number;
  byTier: Record<number, number>;
  byMethod: Record<string, number>;
  byType: Record<string, number>;
}> {
  const sources = await loadAllSources();

  const byTier: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const byMethod: Record<string, number> = { rss: 0, webfetch: 0, websearch: 0 };
  const byType: Record<string, number> = {};
  let enabled = 0;

  for (const source of sources) {
    if (source.tier) {
      byTier[source.tier] = (byTier[source.tier] || 0) + 1;
    }
    byMethod[source.method] = (byMethod[source.method] || 0) + 1;
    byType[source.type] = (byType[source.type] || 0) + 1;
    if (source.enabled) {
      enabled++;
    }
  }

  return {
    total: sources.length,
    enabled,
    byTier,
    byMethod,
    byType,
  };
}

export async function updateSource(
  id: string,
  updates: Partial<Source>
): Promise<Source | null> {
  const allSources = await loadAllSources();
  const source = allSources.find((s) => s.id === id);

  if (!source || !source._file) {
    return null;
  }

  // Read the config file
  const content = await fs.readFile(source._file, "utf-8");
  const config: SourceConfig = JSON.parse(content);

  // Find and update the source
  const sourceIndex = config.sources.findIndex((s) => s.id === id);
  if (sourceIndex === -1) {
    return null;
  }

  // Apply updates (excluding internal fields - tier and _file are added by loader, not stored)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tier: _tier, _file: _filePath, ...cleanUpdates } = updates as Source;
  config.sources[sourceIndex] = {
    ...config.sources[sourceIndex],
    ...cleanUpdates,
  };

  // Write back
  await fs.writeFile(source._file, JSON.stringify(config, null, 2));

  return {
    ...config.sources[sourceIndex],
    tier: source.tier,
    _file: source._file,
  };
}
