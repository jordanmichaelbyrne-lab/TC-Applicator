import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import SettingsTabs from "@/components/settings/SettingsTabs";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getCurrentUserAndCompany();

  const tabs = [
    { href: "/settings", label: "Profile" },
    { href: "/settings/password", label: "Password" },
    { href: "/settings/notifications", label: "Notifications" },
    { href: "/settings/support", label: "Support Request" },
    { href: "/settings/team", label: "Team" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <SettingsTabs tabs={tabs} />
      {children}
    </div>
  );
}