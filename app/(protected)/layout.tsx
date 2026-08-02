import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { getSignedCompanyLogoUrl } from "@/app/lib/repositories/platformOverview";
import { ensureOwnSignupRequest } from "@/app/lib/repositories/signupRequests";
import TopNav from "@/components/nav/TopNav";

function roleLabel(isPlatformAdmin: boolean, isAdmin: boolean) {
  if (isPlatformAdmin) return "TC Applicator Support";
  if (isAdmin) return "Administrator";
  return "Member";
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let context: Awaited<ReturnType<typeof getCurrentUserAndCompany>> | null =
    null;

  try {
    context = await getCurrentUserAndCompany();
  } catch {
    context = null;
  }

  if (!context) {
    const request = await ensureOwnSignupRequest();

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-900">
        <div className="w-full max-w-md rounded-lg border border-slate-300 bg-white p-6 text-center shadow-sm">
          {request?.status === "rejected" ? (
            <>
              <h1 className="text-xl font-semibold text-red-700">
                Request declined
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {request.rejection_reason ||
                  "Your access request was not approved."}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold">Awaiting approval</h1>
              <p className="mt-2 text-sm text-slate-600">
                Your account is pending review by TC Applicator Support
                {request?.platform_approved_at
                  ? " and your company's managers"
                  : ""}
                . Check back soon.
              </p>
            </>
          )}

          <form action={logout} className="mt-6">
            <button
              type="submit"
              className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Sign Out
            </button>
          </form>
        </div>
      </main>
    );
  }

  const {
    companyName,
    companyLogoPath,
    fullName,
    isAdmin,
    isPlatformAdmin,
  } = context;

  const companyLogoUrl = companyLogoPath
    ? await getSignedCompanyLogoUrl(companyLogoPath)
    : null;

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/estimates/new", label: "New Estimate" },
    { href: "/oem-parts", label: "Parts Database" },
    { href: "/approvals", label: "Pending Approvals" },
    { href: "/drawings", label: "Approved Drawings" },
    { href: "/settings", label: "Settings" },
  ];

  if (isAdmin) {
    navLinks.push({ href: "/team-requests", label: "Team Requests" });
    navLinks.push({ href: "/settings/coating-defaults", label: "Coating Defaults" });
  }

  if (isPlatformAdmin) {
    navLinks.push({ href: "/admin/signups", label: "Signup Requests" });
    navLinks.push({ href: "/admin/companies", label: "All Companies" });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center">
            <img
              src="/tc-applicator-logo.png"
              alt="TC Applicator"
              className="h-11 w-auto"
            />
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {companyLogoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={companyLogoUrl}
                  alt={`${companyName} logo`}
                  className="h-8 w-auto"
                />
              )}

              <div className="text-right text-sm">
                <p className="font-medium text-slate-900">
                  {companyName || "—"}
                </p>
                <p className="text-slate-500">
                  {fullName ? `${fullName} · ` : ""}
                  {roleLabel(isPlatformAdmin, isAdmin)}
                </p>
              </div>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        <TopNav links={navLinks} />
      </header>

      {children}
    </div>
  );
}