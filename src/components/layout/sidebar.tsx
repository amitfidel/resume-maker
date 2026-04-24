"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  User,
  LayoutDashboard,
  Briefcase,
  LogOut,
  Upload,
  Settings,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";
import { createResume } from "@/app/(dashboard)/resumes/actions";
import { useT } from "@/lib/i18n/context";

export function Sidebar() {
  const pathname = usePathname();
  const t = useT();

  const navItems = [
    { label: t("sidebar.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("sidebar.resumes"), href: "/resumes", icon: FileText },
    { label: t("sidebar.applications"), href: "/applications", icon: Briefcase },
    { label: t("sidebar.profile"), href: "/profile", icon: User },
    { label: t("sidebar.import"), href: "/import", icon: Upload },
  ];

  return (
    <aside className="flex h-full w-60 flex-col bg-[var(--ink)] text-[#bec6e0]">
      {/* Brand */}
      <div className="px-5 pt-6 pb-2">
        <Link href="/dashboard" className="inline-flex items-baseline gap-0.5">
          <h1 className="font-headline text-[22px] tracking-[-0.02em] text-white">
            Resumi
          </h1>
          <span
            className="ml-1 inline-block h-1.5 w-1.5 self-center rounded-full bg-[var(--magic-2)]"
            style={{ boxShadow: "0 0 10px var(--magic-2)" }}
          />
        </Link>
        <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-[#74777f]">
          {t("brand.tagline")}
        </p>
      </div>

      {/* Create button */}
      <div className="px-4 py-4">
        <form action={createResume}>
          <input type="hidden" name="title" value="Untitled Resume" />
          <Button
            type="submit"
            className="w-full magical-gradient text-white font-medium text-sm h-10 gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            {t("sidebar.create")}
          </Button>
        </form>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#2e354a] text-white"
                  : "text-[#979eb7] hover:bg-[#2e354a]/50 hover:text-white"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer - user + sign out */}
      <div className="border-t border-white/[0.08] p-4">
        <form action={signOut}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-[#979eb7] hover:text-white hover:bg-[#2e354a]/50"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            {t("sidebar.signout")}
          </Button>
        </form>
      </div>
    </aside>
  );
}
