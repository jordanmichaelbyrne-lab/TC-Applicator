"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getOemPart,
  createOemPart,
  updateOemPart,
  deleteOemPart,
} from "@/app/lib/repositories/oemParts";
import type { CreateOemPartInput } from "@/app/types/oem-parts";

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

// ---- Existing: table-row delete, form-based with redirect ----

export async function deleteOemPartAction(formData: FormData) {
  const partId = String(formData.get("partId") ?? "");

  if (!partId) {
    redirect("/oem-parts?error=Missing%20OEM%20part%20ID.");
  }

  try {
    await deleteOemPart(partId);
  } catch (error) {
    const message = toErrorMessage(error, "Unable to delete OEM part.");
    redirect(`/oem-parts?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/oem-parts");
  redirect("/oem-parts?success=OEM%20part%20deleted.");
}

// ---- New: for the client-driven new/edit forms, which need a JSON
// result rather than a redirect, since they manage their own React
// state and error display ----

type GetPartActionResult =
  | { success: true; part: Awaited<ReturnType<typeof getOemPart>> }
  | { success: false; message: string };

export async function getOemPartAction(
  partId: string
): Promise<GetPartActionResult> {
  try {
    const part = await getOemPart(partId);
    return { success: true, part };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to load OEM part."),
    };
  }
}

type OemPartActionResult<T> =
  | { success: true; part: T }
  | { success: false; message: string };

export async function createOemPartAction(
  input: CreateOemPartInput
): Promise<OemPartActionResult<Awaited<ReturnType<typeof createOemPart>>>> {
  try {
    const part = await createOemPart(input);
    revalidatePath("/oem-parts");
    return { success: true, part };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to save OEM part."),
    };
  }
}

export async function updateOemPartAction(
  partId: string,
  input: CreateOemPartInput
): Promise<OemPartActionResult<Awaited<ReturnType<typeof updateOemPart>>>> {
  try {
    const part = await updateOemPart(partId, input);
    revalidatePath("/oem-parts");
    revalidatePath(`/oem-parts/${partId}`);
    return { success: true, part };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to update OEM part."),
    };
  }
}