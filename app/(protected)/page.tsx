import Link from "next/link";
import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { listCompanyEstimates } from "@/app/lib/repositories/estimates";

const navigationItems = [
  {
    title: "New Estimate",
    description: "Create a new tungsten coating estimate.",
    href: "/estimates/new",
  },
  {
    title: "Parts Database",
    description: "Search approved parts and previous coating patterns.",
    href: "/oem-parts",
  },
  {
    title: "Pending Approvals",
    description: "Review estimates awaiting approval.",
    href: "/approvals",
  },
  {
    title: "Approved Drawings",
    description: "View confirmed drawings and coating patterns.",
    href: "/drawings",
  },
];

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

export default async function Home() {
  await getCurrentUserAndCompany();
  const estimates = await listCompanyEstimates();
  const recentEstimates = estimates.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Create estimates, review submissions and manage approved coating
          patterns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {navigationItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-md border border-slate-300 bg-white p-5 hover:border-slate-500"
          >
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-md border border-slate-300 bg-white">
        <div className="border-b border-slate-300 px-5 py-4">
          <h3 className="font-semibold">Recent Estimates</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-medium">OEM Part Number</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Sell Price</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentEstimates.map((estimate) => (
                <tr key={estimate.id} className="border-t border-slate-200">
                  <td className="px-5 py-3 font-medium">
                    {estimate.oem_part_number}
                  </td>
                  <td className="px-5 py-3">
                    {estimate.customer_name || "—"}
                  </td>
                  <td className="px-5 py-3">
                    {formatCurrency(estimate.total_sell_price)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs capitalize">
                      {estimate.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}

              {recentEstimates.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No estimates yet — create your first one to see it here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}