"use server";

import {
  getOwnCompanyReport,
  getCompanyReportForPlatformAdmin,
  type ReportData,
} from "@/app/lib/repositories/reports";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function getReportDataAction(): Promise<ActionResult<ReportData>> {
  try {
    const data = await getOwnCompanyReport();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to load report data."),
    };
  }
}

export async function getReportDataForCompanyAction(
  companyId: string
): Promise<ActionResult<ReportData>> {
  try {
    const data = await getCompanyReportForPlatformAdmin(companyId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to load report data."),
    };
  }
}