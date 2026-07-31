"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteOemPart } from "@/app/lib/repositories/oemParts";

export async function deleteOemPartAction(
  formData: FormData
) {
  const partId = String(formData.get("partId") ?? "");

  if (!partId) {
    redirect("/oem-parts?error=Missing%20OEM%20part%20ID.");
  }

  try {
    await deleteOemPart(partId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete OEM part.";

    redirect(
      `/oem-parts?error=${encodeURIComponent(message)}`
    );
  }

  revalidatePath("/oem-parts");
  redirect("/oem-parts?success=OEM%20part%20deleted.");
}