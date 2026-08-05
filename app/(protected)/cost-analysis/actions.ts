"use server";

import {
  saveCostAnalysisSnapshot,
  listCostAnalysisSnapshots,
  type CostAnalysisInput,
  type CostAnalysisSnapshot,
} from "@/app/lib/repositories/costAnalysis";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function saveCostAnalysisSnapshotAction(
  input: CostAnalysisInput
): Promise<ActionResult<CostAnalysisSnapshot>> {
  try {
    const snapshot = await saveCostAnalysisSnapshot(input);
    return { success: true, data: snapshot };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to save the snapshot."),
    };
  }
}

export async function listCostAnalysisSnapshotsAction(): Promise<
  ActionResult<CostAnalysisSnapshot[]>
> {
  try {
    const snapshots = await listCostAnalysisSnapshots();
    return { success: true, data: snapshots };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to load history."),
    };
  }
}