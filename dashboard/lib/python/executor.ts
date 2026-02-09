import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { initializeDatabase, getDatabase } from "@/lib/db/database";
import { createManyItems } from "@/lib/db/items";
import { updateSource, recordSourceError, clearSourceError } from "@/lib/db/sources";

export interface FetchJob {
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

// In-memory job storage (in production, use a database)
const jobs: Map<string, FetchJob> = new Map();
const processes: Map<string, ChildProcess> = new Map();

function getScriptsPath(): string {
  const scriptsPath = process.env.SCRIPTS_PATH || "../scripts";
  return path.resolve(process.cwd(), scriptsPath);
}

export function createJob(
  type: FetchJob["type"],
  options?: { tier?: number; sourceId?: string }
): FetchJob {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const job: FetchJob = {
    id,
    type,
    tier: options?.tier,
    sourceId: options?.sourceId,
    status: "pending",
    output: [],
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): FetchJob | undefined {
  return jobs.get(id);
}

export function getAllJobs(): FetchJob[] {
  return Array.from(jobs.values()).sort(
    (a, b) =>
      new Date(b.startedAt || 0).getTime() -
      new Date(a.startedAt || 0).getTime()
  );
}

export async function runFetchJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  job.status = "running";
  job.startedAt = new Date().toISOString();
  job.output = [];

  const scriptsPath = getScriptsPath();

  let scriptName: string;
  const args: string[] = [];

  switch (job.type) {
    case "rss":
      scriptName = "fetch_rss.py";
      if (job.tier) {
        args.push("--tier", job.tier.toString());
      }
      if (job.sourceId) {
        args.push("--source", job.sourceId);
      }
      break;
    case "page_monitor":
      scriptName = "monitor_pages.py";
      if (job.tier) {
        args.push("--tier", job.tier.toString());
      }
      if (job.sourceId) {
        args.push("--source", job.sourceId);
      }
      break;
    case "websearch":
      scriptName = "websearch.py";
      if (job.tier) {
        args.push("--tier", job.tier.toString());
      }
      break;
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }

  const scriptPath = path.join(scriptsPath, scriptName);

  return new Promise((resolve, reject) => {
    const process = spawn("python3", [scriptPath, ...args], {
      cwd: scriptsPath,
      env: {
        ...global.process.env,
        PYTHONUNBUFFERED: "1",
      },
    });

    processes.set(jobId, process);

    process.stdout.on("data", (data) => {
      const lines = data.toString().split("\n").filter(Boolean);
      job.output.push(...lines);
    });

    process.stderr.on("data", (data) => {
      const lines = data.toString().split("\n").filter(Boolean);
      job.output.push(...lines.map((l: string) => `[stderr] ${l}`));
    });

    process.on("close", async (code) => {
      processes.delete(jobId);
      job.completedAt = new Date().toISOString();

      if (code === 0) {
        job.status = "completed";

        // Import fetched items into SQLite
        if (job.type === "rss" || job.type === "page_monitor" || job.type === "websearch") {
          try {
            await importFetchedItems();
            job.output.push("[dashboard] Items imported to SQLite");

            // Clear error for this source if it had one
            if (job.sourceId) {
              clearSourceError(job.sourceId);
              job.output.push(`[dashboard] Cleared error for source ${job.sourceId}`);
            }
          } catch (err) {
            job.output.push(`[dashboard] Error importing items: ${err}`);

            // Record the import error
            if (job.sourceId) {
              recordSourceError(job.sourceId, `Import failed: ${err}`);
            }
          }
        }

        resolve();
      } else {
        job.status = "failed";
        job.error = `Process exited with code ${code}`;

        // Record error for this source
        if (job.sourceId) {
          const errorDetails = job.output.slice(-5).join("\n"); // Last 5 lines of output
          recordSourceError(job.sourceId, `Fetch failed (exit code ${code}): ${errorDetails}`);
        }

        reject(new Error(job.error));
      }
    });

    process.on("error", (err) => {
      processes.delete(jobId);
      job.status = "failed";
      job.error = err.message;
      job.completedAt = new Date().toISOString();

      // Record error for this source
      if (job.sourceId) {
        recordSourceError(job.sourceId, `Process error: ${err.message}`);
      }

      reject(err);
    });
  });
}

export function cancelJob(jobId: string): boolean {
  const process = processes.get(jobId);
  if (process) {
    process.kill("SIGTERM");
    processes.delete(jobId);

    const job = jobs.get(jobId);
    if (job) {
      job.status = "failed";
      job.error = "Cancelled by user";
      job.completedAt = new Date().toISOString();
    }
    return true;
  }
  return false;
}

export function clearOldJobs(maxAge: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (job.completedAt) {
      const completedAt = new Date(job.completedAt).getTime();
      if (now - completedAt > maxAge) {
        jobs.delete(id);
      }
    }
  }
}

/**
 * Import fetched items from new_items.json into SQLite
 */
async function importFetchedItems(): Promise<number> {
  initializeDatabase();

  const outputPath = process.env.OUTPUT_PATH || path.resolve(process.cwd(), "../sources/downloaded");
  const newItemsPath = path.join(outputPath, "new_items.json");

  if (!fs.existsSync(newItemsPath)) {
    console.log("No new_items.json found");
    return 0;
  }

  const content = fs.readFileSync(newItemsPath, "utf-8");
  const data = JSON.parse(content);

  if (!data.items || !Array.isArray(data.items)) {
    console.log("No items in new_items.json");
    return 0;
  }

  // Convert to the format expected by createManyItems
  const items = data.items.map((item: {
    url: string;
    title: string;
    snippet?: string;
    source_id?: string;
    source_name?: string;
    published?: string;
    focus_areas?: string[];
  }) => {
    // Convert published date to ISO format for proper sorting
    let publishedISO = new Date().toISOString();
    if (item.published) {
      try {
        const parsedDate = new Date(item.published);
        if (!isNaN(parsedDate.getTime())) {
          publishedISO = parsedDate.toISOString();
        }
      } catch {
        // If parsing fails, use current date
      }
    }

    return {
      url: item.url,
      title: item.title,
      snippet: item.snippet || "",
      source_id: item.source_id || "",
      source_name: item.source_name || "",
      published: publishedISO,
      focus_areas: item.focus_areas || [],
    };
  });

  const inserted = createManyItems(items);

  // Update last_fetch for sources
  const now = new Date().toISOString();
  const sourceIds = [...new Set(items.map((i: { source_id: string }) => i.source_id).filter(Boolean))];
  for (const sourceId of sourceIds) {
    updateSource(sourceId as string, { last_fetch: now } as unknown as import("@/types/source").Source);
  }

  console.log(`Imported ${inserted} new items from ${sourceIds.length} sources`);
  return inserted;
}
