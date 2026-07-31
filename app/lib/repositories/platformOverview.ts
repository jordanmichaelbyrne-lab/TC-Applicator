import "server-only";

import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";

async function assertPlatformAdmin() {
  const ctx = await getCurrentUserAndCompany();

  if (!ctx.isPlatformAdmin) {
    throw new Error("Only TC Applicator Support can view this.");
  }

  return ctx;
}

/**
 * Any authenticated user can request a signed URL for a logo path —
 * storage RLS is what actually enforces "only your own company, or a
 * platform admin" here, so this just needs a valid session.
 */
export async function getSignedCompanyLogoUrl(logoPath: string) {
  const { supabase } = await getCurrentUserAndCompany();

  const { data, error } = await supabase.storage
    .from("company-logos")
    .createSignedUrl(logoPath, 3600);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}

export async function setCompanyLogo(companyId: string, file: File) {
  const { supabase } = await assertPlatformAdmin();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${companyId}/logo-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("company-logos")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Unable to upload logo: ${uploadError.message}`);
  }

  const { error: updateError } = await supabase
    .from("companies")
    .update({ logo_url: path })
    .eq("id", companyId);

  if (updateError) {
    throw new Error(`Unable to save logo: ${updateError.message}`);
  }

  return path;
}

export async function removeCompanyLogo(companyId: string) {
  const { supabase } = await assertPlatformAdmin();

  const { error } = await supabase
    .from("companies")
    .update({ logo_url: null })
    .eq("id", companyId);

  if (error) {
    throw new Error(`Unable to remove logo: ${error.message}`);
  }
}

export type CompanyOverviewSummary = {
  id: string;
  name: string;
  memberCount: number;
  adminCount: number;
  estimateCounts: {
    draft: number;
    pending_approval: number;
    approved: number;
    rejected: number;
  };
};

export async function listAllCompaniesOverview(): Promise<
  CompanyOverviewSummary[]
> {
  const { supabase } = await assertPlatformAdmin();

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id, name")
    .order("name");

  if (companiesError) {
    throw new Error(`Unable to load companies: ${companiesError.message}`);
  }

  const summaries: CompanyOverviewSummary[] = [];

  for (const company of companies ?? []) {
    const { data: members, error: membersError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("company_id", company.id);

    if (membersError) {
      throw new Error(
        `Unable to load members for ${company.name}: ${membersError.message}`
      );
    }

    const memberList = members ?? [];
    const memberCount = memberList.length;
    const adminCount = memberList.filter((m) => m.is_admin).length;

    const { data: estimates, error: estimatesError } = await supabase
      .from("estimates")
      .select("status")
      .eq("company_id", company.id);

    if (estimatesError) {
      throw new Error(
        `Unable to load estimates for ${company.name}: ${estimatesError.message}`
      );
    }

    const estimateCounts = {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      rejected: 0,
    };

    for (const estimate of estimates ?? []) {
      const status = estimate.status as keyof typeof estimateCounts;
      if (status in estimateCounts) {
        estimateCounts[status] += 1;
      }
    }

    summaries.push({
      id: company.id,
      name: company.name,
      memberCount,
      adminCount,
      estimateCounts,
    });
  }

  return summaries;
}

export type CompanyMember = {
  id: string;
  full_name: string | null;
  is_admin: boolean;
  is_platform_admin: boolean;
};

export type CompanyOverviewEstimate = {
  id: string;
  oem_part_number: string;
  customer_name: string | null;
  total_sell_price: number | null;
  status: string;
  created_at: string;
};

export type CompanyOverviewDetail = {
  id: string;
  name: string;
  logoUrl: string | null;
  members: CompanyMember[];
  recentEstimates: CompanyOverviewEstimate[];
  oemPartCount: number;
};

export async function getCompanyOverview(
  companyId: string
): Promise<CompanyOverviewDetail | null> {
  const { supabase } = await assertPlatformAdmin();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, logo_url")
    .eq("id", companyId)
    .maybeSingle();

  if (companyError) {
    throw new Error(`Unable to load company: ${companyError.message}`);
  }

  if (!company) {
    return null;
  }

  const { data: members, error: membersError } = await supabase
    .from("profiles")
    .select("id, full_name, is_admin, is_platform_admin")
    .eq("company_id", companyId)
    .order("full_name");

  if (membersError) {
    throw new Error(`Unable to load members: ${membersError.message}`);
  }

  const { data: estimates, error: estimatesError } = await supabase
    .from("estimates")
    .select(
      "id, oem_part_number, customer_name, total_sell_price, status, created_at"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (estimatesError) {
    throw new Error(`Unable to load estimates: ${estimatesError.message}`);
  }

  const { count: oemPartCount, error: oemPartsError } = await supabase
    .from("oem_parts")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (oemPartsError) {
    throw new Error(`Unable to load OEM parts: ${oemPartsError.message}`);
  }

  return {
    id: company.id,
    name: company.name,
    logoUrl: company.logo_url,
    members: (members ?? []) as CompanyMember[],
    recentEstimates: (estimates ?? []) as CompanyOverviewEstimate[],
    oemPartCount: oemPartCount ?? 0,
  };
}