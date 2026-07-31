"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SettingsTab = {
  href: string;
  label: string;
};

export default function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const pathname = usePathname();

  return (
    <nav className="mb-6 border-b border-slate-300">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}