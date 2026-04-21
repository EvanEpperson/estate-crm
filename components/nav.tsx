"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, Mail, UserPlus, Building2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/clients/new", label: "Add Client", icon: UserPlus },
  { href: "/email", label: "Mass Email", icon: Mail },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--color-border)] glass sticky top-0 h-screen">
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] grid place-items-center shadow-lg shadow-[color-mix(in_oklch,var(--color-primary)_30%,transparent)]">
          <Building2 className="size-5" />
        </div>
        <div>
          <div className="font-semibold leading-tight">Estate CRM</div>
          <div className="text-xs text-[var(--color-muted-foreground)]">Your book of business</div>
        </div>
      </div>

      <nav className="px-3 py-2 space-y-1">
        {links.map((l) => {
          const Icon = l.icon;
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
              )}
            >
              <Icon className="size-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
