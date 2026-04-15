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

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Resumes", href: "/resumes", icon: FileText },
  { label: "Job Tracker", href: "/applications", icon: Briefcase },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Import", href: "/import", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col bg-[#182034] text-[#bec6e0]">
      {/* Brand */}
      <div className="px-5 pt-6 pb-2">
        <Link href="/dashboard" className="block">
          <h1 className="font-headline text-lg font-bold text-white">
            The Architect
          </h1>
          <p className="text-[0.65rem] uppercase tracking-[0.15em] text-[#74777f]">
            Premium Plan
          </p>
        </Link>
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
            Create New Resume
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
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
