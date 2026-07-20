import type { RunResult } from "../types";

export type RunMode = "run" | "check";

export async function executeSpark(code: string, mode: RunMode, labId?: string): Promise<RunResult> {
  const response = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, mode, lab_id: labId }),
  });

  const payload = (await response.json()) as RunResult;
  if (!response.ok) {
    throw new Error(payload.error || `Runner returned ${response.status}`);
  }
  return payload;
}

export async function runnerAvailable(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", { signal: AbortSignal.timeout(2500) });
    return response.ok;
  } catch {
    return false;
  }
}
