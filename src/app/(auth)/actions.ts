"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/db";
import { users, careerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

async function ensureUserInDb(id: string, email: string, fullName?: string | null) {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!existing) {
    await db.insert(users).values({
      id,
      email,
      fullName: fullName ?? null,
    });

    await db.insert(careerProfiles).values({
      userId: id,
      email,
    });
  }
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    try {
      await ensureUserInDb(data.user.id, email, fullName);
    } catch (err) {
      console.error("Error creating user record:", err);
      // Don't block signup if DB insert fails on duplicate
    }
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Ensure user exists in our DB (handles edge case where auth user exists but DB user doesn't)
  if (data.user) {
    try {
      await ensureUserInDb(data.user.id, data.user.email!, data.user.user_metadata?.full_name);
    } catch {
      // Non-blocking
    }
  }

  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
