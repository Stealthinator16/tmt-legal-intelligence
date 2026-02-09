import { spawn, ChildProcess } from "child_process";
import path from "path";
import { recordSourceError, clearSourceError } from "@/lib/db/sources";

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

        // Python scripts now write directly to tmt_intelligence.db
        job.output.push("[dashboard] Fetch complete (Python wrote to DB directly)");

        if (job.sourceId) {
          clearSourceError(job.sourceId);
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

