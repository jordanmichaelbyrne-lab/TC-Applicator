"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

export default function TopNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="border-t border-slate-200">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}