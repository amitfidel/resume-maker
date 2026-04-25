import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, careerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";

  // Open-redirect guard. The `next` param is attacker-controllable
  // (anyone can craft an auth link). Only allow same-origin paths
  // starting with a single `/` — reject `//evil.com`, `/\evil.com`,
  // and protocol-qualified URLs.
  const isSafePath =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.startsWith("/\\") &&
    !rawNext.includes(":");
  const next = isSafePath ? rawNext : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure user record exists in our DB
      const existing = await db.query.users.findFirst({
        where: eq(users.id, data.user.id),
      });

      if (!existing) {
        await db.insert(users).values({
          id: data.user.id,
          email: data.user.email!,
          fullName: data.user.user_metadata?.full_name ?? null,
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
        });

        await db.insert(careerProfiles).values({
          userId: data.user.id,
          email: data.user.email!,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
