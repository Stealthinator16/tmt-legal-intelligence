import { NextRequest, NextResponse } from "next/server";
import {
  createJob,
  runFetchJob,
  getJob,
  getAllJobs,
  cancelJob,
  FetchJob,
} from "@/lib/python/executor";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("id");

  if (jobId) {
    const job = getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json(job);
  }

  // Return all jobs
  const jobs = getAllJobs();
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, tier, sourceId } = body;

    if (!type || !["rss", "page_monitor", "websearch"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid job type. Must be 'rss', 'page_monitor', or 'websearch'" },
        { status: 400 }
      );
    }

    // Create the job
    const job = createJob(type as FetchJob["type"], { tier, sourceId });

    // Start the job asynchronously
    runFetchJob(job.id).catch((error) => {
      console.error(`Job ${job.id} failed:`, error);
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating fetch job:", error);
    return NextResponse.json(
      { error: "Failed to create fetch job" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("id");

  if (!jobId) {
    return NextResponse.json(
      { error: "Job ID is required" },
      { status: 400 }
    );
  }

  const cancelled = cancelJob(jobId);
  if (cancelled) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json(
      { error: "Job not found or already completed" },
      { status: 404 }
    );
  }
}
