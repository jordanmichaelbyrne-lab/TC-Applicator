import "server-only";

import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import {
  mapCreateOemPartInput,
  mapOemPartRow,
  type CreateOemPartInput,
  type OemPartRow,
} from "@/app/types/oem-parts";

// The real, database-backed shape of an OEM part — every id here is a
// genuine Supabase UUID, unlike the old static app/data/oemParts.ts
// list, which used hand-written ids like "cat-1099212" that don't
// correspond to any real row and can't be used as a foreign key.
export type OemPart = ReturnType<typeof mapOemPartRow>;

// IMPORTANT: this catalog is private per company. A CAT 1099212's
// physical dimensions might be identical everywhere, but the standard
// coating pattern stored alongside it is each company's own
// methodology — not something competitors using this same product
// should ever be able to see. Every query below is scoped by
// company_id, backed by RLS as the real enforcement layer.

export async function getOemParts() {
  const { supabase, companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("oem_parts")
    .select("*")
    .eq("company_id", companyId)
    .order("manufacturer")
    .order("oem_part_number");

  if (error) {
    throw new Error(
      `Unable to load OEM parts: ${error.message}`
    );
  }

  return ((data ?? []) as OemPartRow[]).map(
    mapOemPartRow
  );
}

export async function getOemPart(partId: string) {
  const { supabase, companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("oem_parts")
    .select("*")
    .eq("id", partId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load OEM part: ${error.message}`
    );
  }

  return data
    ? mapOemPartRow(data as OemPartRow)
    : null;
}

export async function searchOemParts(
  searchTerm: string
) {
  const cleanedSearch = searchTerm.trim();

  if (!cleanedSearch) {
    return getOemParts();
  }

  const safeSearch = cleanedSearch
    .replaceAll(",", " ")
    .replaceAll("%", "")
    .trim();

  const { supabase, companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("oem_parts")
    .select("*")
    .eq("company_id", companyId)
    .or(
      [
        `oem_part_number.ilike.%${safeSearch}%`,
        `manufacturer.ilike.%${safeSearch}%`,
        `description.ilike.%${safeSearch}%`,
        `part_category.ilike.%${safeSearch}%`,
        `profile_family.ilike.%${safeSearch}%`,
      ].join(",")
    )
    .order("manufacturer")
    .order("oem_part_number")
    .limit(50);

  if (error) {
    throw new Error(
      `Unable to search OEM parts: ${error.message}`
    );
  }

  return ((data ?? []) as OemPartRow[]).map(
    mapOemPartRow
  );
}

export async function createOemPart(
  input: CreateOemPartInput
) {
  const { supabase, user, companyId } = await getCurrentUserAndCompany();

  const row = {
    ...mapCreateOemPartInput(input, user.id),
    company_id: companyId,
  };

  const { data, error } = await supabase
    .from("oem_parts")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "This manufacturer and OEM part number already exist in your company's catalog."
      );
    }

    throw new Error(
      `Unable to create OEM part: ${error.message}`
    );
  }

  return mapOemPartRow(data as OemPartRow);
}

export async function updateOemPart(
  partId: string,
  input: CreateOemPartInput
) {
  const { supabase, user, companyId } = await getCurrentUserAndCompany();

  const row = mapCreateOemPartInput(input, user.id);

  const { data, error } = await supabase
    .from("oem_parts")
    .update({
      ...row,
      updated_by: user.id,
    })
    .eq("id", partId)
    .eq("company_id", companyId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "This manufacturer and OEM part number already exist in your company's catalog."
      );
    }

    throw new Error(
      `Unable to update OEM part: ${error.message}`
    );
  }

  return mapOemPartRow(data as OemPartRow);
}

export async function deleteOemPart(
  partId: string
) {
  const { supabase, companyId } = await getCurrentUserAndCompany();

  const { error } = await supabase
    .from("oem_parts")
    .delete()
    .eq("id", partId)
    .eq("company_id", companyId);

  if (error) {
    throw new Error(
      `Unable to delete OEM part: ${error.message}`
    );
  }
}