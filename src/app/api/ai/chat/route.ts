import { generateText, tool, stepCountIs } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { buildChatAgentPrompt } from "@/lib/ai/prompts/chat-agent";
import { resolveResume } from "@/lib/resume/resolve";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  resumes,
  resumeBlocks,
  resumeBlockItems,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { resumeId, messages } = await req.json();

  // Verify ownership
  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)),
  });
  if (!resume) {
    return new Response("Not found", { status: 404 });
  }

  const resolved = await resolveResume(resumeId);
  if (!resolved) {
    return new Response("Could not resolve resume", { status: 500 });
  }

  const systemPrompt = buildChatAgentPrompt(resolved);

  // Track tool actions to report back to the UI
  const actions: Array<{ tool: string; description: string }> = [];

  try {
    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages,
      stopWhen: stepCountIs(8),
      tools: {
        updateSummary: tool({
          description: "Rewrite or set the resume's professional summary.",
          inputSchema: z.object({
            text: z
              .string()
              .describe(
                "The new summary text. Keep it 2-3 sentences, focused on value."
              ),
          }),
          execute: async ({ text }) => {
            await db
              .update(resumes)
              .set({ summaryOverride: text, updatedAt: new Date() })
              .where(eq(resumes.id, resumeId));
            actions.push({
              tool: "updateSummary",
              description: "Updated professional summary",
            });
            return { success: true };
          },
        }),

        rewriteBullet: tool({
          description:
            "Rewrite a specific bullet point. Provide the item ID (from ITEM block), the bullet ID (from BULLET lines), and the new text.",
          inputSchema: z.object({
            itemId: z.string().describe("The resume_block_item ID containing the bullet"),
            bulletId: z.string().describe("The specific bullet ID to rewrite"),
            newText: z.string().describe("The rewritten bullet text"),
          }),
          execute: async ({ itemId, bulletId, newText }) => {
            const item = await db.query.resumeBlockItems.findFirst({
              where: eq(resumeBlockItems.id, itemId),
            });
            if (!item) return { error: "Item not found" };

            const overrides = (item.overrides ?? {}) as Record<string, unknown>;
            const bullets = (overrides.bullets ?? {}) as Record<
              string,
              { text?: string; visible?: boolean }
            >;
            bullets[bulletId] = { ...(bullets[bulletId] ?? {}), text: newText };

            await db
              .update(resumeBlockItems)
              .set({
                overrides: { ...overrides, bullets },
                updatedAt: new Date(),
              })
              .where(eq(resumeBlockItems.id, itemId));

            actions.push({
              tool: "rewriteBullet",
              description: `Rewrote a bullet: "${newText.slice(0, 50)}${newText.length > 50 ? "..." : ""}"`,
            });
            return { success: true };
          },
        }),

        hideBullet: tool({
          description:
            "Hide a specific bullet point from the resume (keeps it in profile but hides from this resume version).",
          inputSchema: z.object({
            itemId: z.string(),
            bulletId: z.string(),
          }),
          execute: async ({ itemId, bulletId }) => {
            const item = await db.query.resumeBlockItems.findFirst({
              where: eq(resumeBlockItems.id, itemId),
            });
            if (!item) return { error: "Item not found" };

            const overrides = (item.overrides ?? {}) as Record<string, unknown>;
            const bullets = (overrides.bullets ?? {}) as Record<
              string,
              { text?: string; visible?: boolean }
            >;
            bullets[bulletId] = { ...(bullets[bulletId] ?? {}), visible: false };

            await db
              .update(resumeBlockItems)
              .set({
                overrides: { ...overrides, bullets },
                updatedAt: new Date(),
              })
              .where(eq(resumeBlockItems.id, itemId));

            actions.push({ tool: "hideBullet", description: "Hid a bullet point" });
            return { success: true };
          },
        }),

        toggleItemVisibility: tool({
          description: "Show or hide an entire item (experience, project, etc.) on this resume.",
          inputSchema: z.object({
            itemId: z.string(),
            visible: z.boolean(),
          }),
          execute: async ({ itemId, visible }) => {
            await db
              .update(resumeBlockItems)
              .set({ isVisible: visible, updatedAt: new Date() })
              .where(eq(resumeBlockItems.id, itemId));
            actions.push({
              tool: "toggleItemVisibility",
              description: visible ? "Showed an item" : "Hid an item",
            });
            return { success: true };
          },
        }),

        toggleBlockVisibility: tool({
          description: "Show or hide an entire section (experience, skills, education, etc.).",
          inputSchema: z.object({
            blockId: z.string(),
            visible: z.boolean(),
          }),
          execute: async ({ blockId, visible }) => {
            await db
              .update(resumeBlocks)
              .set({ isVisible: visible, updatedAt: new Date() })
              .where(eq(resumeBlocks.id, blockId));
            actions.push({
              tool: "toggleBlockVisibility",
              description: visible ? "Showed a section" : "Hid a section",
            });
            return { success: true };
          },
        }),

        reorderBlocks: tool({
          description:
            "Reorder resume sections. Provide the block IDs in the desired order.",
          inputSchema: z.object({
            blockIds: z
              .array(z.string())
              .describe("Array of block IDs in the new order"),
          }),
          execute: async ({ blockIds }) => {
            await Promise.all(
              blockIds.map((blockId, index) =>
                db
                  .update(resumeBlocks)
                  .set({ sortOrder: index, updatedAt: new Date() })
                  .where(
                    and(
                      eq(resumeBlocks.id, blockId),
                      eq(resumeBlocks.resumeId, resumeId)
                    )
                  )
              )
            );
            actions.push({ tool: "reorderBlocks", description: "Reordered sections" });
            return { success: true };
          },
        }),

        renameSection: tool({
          description:
            "Change the heading/title of a section (e.g., 'Experience' -> 'Professional Experience').",
          inputSchema: z.object({
            blockId: z.string(),
            newHeading: z.string(),
          }),
          execute: async ({ blockId, newHeading }) => {
            await db
              .update(resumeBlocks)
              .set({ headingOverride: newHeading, updatedAt: new Date() })
              .where(eq(resumeBlocks.id, blockId));
            actions.push({
              tool: "renameSection",
              description: `Renamed section to "${newHeading}"`,
            });
            return { success: true };
          },
        }),
      },
    });

    // Revalidate the editor page so the preview updates
    if (actions.length > 0) {
      revalidatePath(`/resumes/${resumeId}/edit`);
    }

    return Response.json({
      text: result.text,
      actions,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
