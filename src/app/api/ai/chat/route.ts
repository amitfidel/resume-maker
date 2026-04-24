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
import {
  addStandardSection,
  addCustomSection,
  addItemToBlock,
  removeItemFromBlock,
  addBulletToItem,
  deleteBullet as deleteBulletAction,
  deleteBlock as deleteBlockAction,
  updateItemField as updateItemFieldAction,
  reorderItems as reorderItemsAction,
} from "@/app/(dashboard)/resumes/actions";

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
      // openai/gpt-oss-120b is much stronger at structured tool calling than
      // llama-3.3-70b-versatile on Groq. Override with GROQ_MODEL if needed.
      model: groq(process.env.GROQ_MODEL || "openai/gpt-oss-120b"),
      system: systemPrompt,
      messages,
      stopWhen: stepCountIs(20),
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

        addSection: tool({
          description:
            "Add a new section to the resume. For standard sections pass `type` as one of: summary, experience, education, skills, projects, certifications. For a custom section (e.g. Awards, Volunteering), pass type='custom' AND customHeading with the label. After adding, call addItem to populate it.",
          inputSchema: z.object({
            type: z
              .string()
              .describe(
                "One of: summary | experience | education | skills | projects | certifications | custom",
              ),
            customHeading: z
              .string()
              .describe(
                "Heading for a custom section. Pass empty string '' when type is not 'custom'.",
              ),
          }),
          execute: async ({ type, customHeading }) => {
            const validStandard = [
              "summary",
              "experience",
              "education",
              "skills",
              "projects",
              "certifications",
            ];
            if (type === "custom") {
              const heading = (customHeading || "").trim();
              if (!heading) {
                return {
                  error:
                    "customHeading is required when type='custom'. Ask the user what to name it.",
                };
              }
              await addCustomSection(resumeId, heading);
              actions.push({
                tool: "addSection",
                description: `Added custom section "${heading}"`,
              });
            } else if (validStandard.includes(type)) {
              await addStandardSection(
                resumeId,
                type as
                  | "summary"
                  | "experience"
                  | "education"
                  | "skills"
                  | "projects"
                  | "certifications",
              );
              actions.push({
                tool: "addSection",
                description: `Added ${type} section`,
              });
            } else {
              return {
                error: `Unknown type "${type}". Must be one of summary, experience, education, skills, projects, certifications, custom.`,
              };
            }
            return { success: true };
          },
        }),

        deleteSection: tool({
          description:
            "Delete a section entirely from this resume (doesn't delete from the career profile).",
          inputSchema: z.object({
            blockId: z.string(),
          }),
          execute: async ({ blockId }) => {
            await deleteBlockAction(resumeId, blockId);
            actions.push({
              tool: "deleteSection",
              description: "Deleted a section",
            });
            return { success: true };
          },
        }),

        addItem: tool({
          description:
            "Add a new empty item to a section (e.g. a new Experience entry, a new Skill, a new Project). Returns the new itemId so you can immediately call updateItemField to populate it.",
          inputSchema: z.object({
            blockId: z
              .string()
              .describe("The section ID to add the item to"),
          }),
          execute: async ({ blockId }) => {
            await addItemToBlock(resumeId, blockId);
            // Fetch the newest item for this block so the model has its ID
            const items = await db.query.resumeBlockItems.findMany({
              where: eq(resumeBlockItems.blockId, blockId),
              orderBy: (t, { desc }) => [desc(t.createdAt)],
              limit: 1,
            });
            const newItemId = items[0]?.id;
            actions.push({
              tool: "addItem",
              description: "Added a new item to a section",
            });
            return { success: true, itemId: newItemId };
          },
        }),

        removeItem: tool({
          description:
            "Remove an item from this resume (doesn't affect the career profile).",
          inputSchema: z.object({
            itemId: z.string(),
          }),
          execute: async ({ itemId }) => {
            await removeItemFromBlock(resumeId, itemId);
            actions.push({
              tool: "removeItem",
              description: "Removed an item",
            });
            return { success: true };
          },
        }),

        updateItemField: tool({
          description:
            "Update any field on an item. experience fields: title, company, location, startDate, endDate, description. education fields: institution, degree, fieldOfStudy, startDate, endDate, gpa, description. skills fields: name, category, proficiency. projects fields: name, url, description. certifications fields: name, issuer, issueDate, expiryDate, credentialUrl. custom fields: title, text. Dates in YYYY-MM format. Pass empty string '' to clear a field.",
          inputSchema: z.object({
            itemId: z.string(),
            field: z.string().describe("The field name"),
            value: z
              .string()
              .describe("New value. Pass empty string '' to clear."),
          }),
          execute: async ({ itemId, field, value }) => {
            await updateItemFieldAction(
              resumeId,
              itemId,
              field,
              value === "" ? null : value,
            );
            actions.push({
              tool: "updateItemField",
              description: `Set ${field} = "${value.slice(0, 40)}${value.length > 40 ? "…" : ""}"`,
            });
            return { success: true };
          },
        }),

        addBullet: tool({
          description:
            "Add a new bullet to an experience or project item. If you know the bullet's text, pass it directly. Otherwise pass empty string '' and call rewriteBullet afterwards.",
          inputSchema: z.object({
            itemId: z.string(),
            text: z
              .string()
              .describe(
                "The bullet text. Pass empty string '' if you don't know it yet.",
              ),
          }),
          execute: async ({ itemId, text }) => {
            await addBulletToItem(resumeId, itemId);
            // Look up the bullet that was just created
            const item = await db.query.resumeBlockItems.findFirst({
              where: eq(resumeBlockItems.id, itemId),
            });
            if (!item) return { error: "Item not found" };

            let bulletId: string | undefined;
            if (item.sourceType === "work_experience") {
              const { experienceBullets } = await import("@/db/schema");
              const rows = await db.query.experienceBullets.findMany({
                where: eq(experienceBullets.experienceId, item.sourceId),
                orderBy: (t, { desc }) => [desc(t.sortOrder)],
                limit: 1,
              });
              bulletId = rows[0]?.id;
              if (text && bulletId) {
                await db
                  .update(experienceBullets)
                  .set({ text, updatedAt: new Date() })
                  .where(eq(experienceBullets.id, bulletId));
              }
            } else if (item.sourceType === "project") {
              const { projectBullets } = await import("@/db/schema");
              const rows = await db.query.projectBullets.findMany({
                where: eq(projectBullets.projectId, item.sourceId),
                orderBy: (t, { desc }) => [desc(t.sortOrder)],
                limit: 1,
              });
              bulletId = rows[0]?.id;
              if (text && bulletId) {
                await db
                  .update(projectBullets)
                  .set({ text, updatedAt: new Date() })
                  .where(eq(projectBullets.id, bulletId));
              }
            }

            actions.push({
              tool: "addBullet",
              description: text
                ? `Added bullet: "${text.slice(0, 50)}${text.length > 50 ? "…" : ""}"`
                : "Added a blank bullet",
            });
            return { success: true, bulletId };
          },
        }),

        deleteBullet: tool({
          description:
            "Permanently delete a bullet from the underlying profile. Destructive. Prefer hideBullet if the user may want it later on a different resume.",
          inputSchema: z.object({
            itemId: z.string(),
            bulletId: z.string(),
          }),
          execute: async ({ itemId, bulletId }) => {
            await deleteBulletAction(resumeId, itemId, bulletId);
            actions.push({
              tool: "deleteBullet",
              description: "Deleted a bullet",
            });
            return { success: true };
          },
        }),

        reorderItems: tool({
          description:
            "Reorder items within a section (e.g., reorder work experience entries). Pass the full list of item IDs in the desired order.",
          inputSchema: z.object({
            blockId: z.string(),
            itemIds: z.array(z.string()),
          }),
          execute: async ({ blockId, itemIds }) => {
            await reorderItemsAction(resumeId, blockId, itemIds);
            actions.push({
              tool: "reorderItems",
              description: "Reordered items within a section",
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
    // Surface Groq's `failed_generation` body so we can see what the model
    // actually emitted when tool-call JSON breaks.
    console.error("Chat error:", error);
    const err = error as {
      message?: string;
      responseBody?: string;
      data?: unknown;
      cause?: { message?: string; responseBody?: string };
    };
    if (err.responseBody) console.error("Groq responseBody:", err.responseBody);
    if (err.cause?.responseBody)
      console.error("Groq cause.responseBody:", err.cause.responseBody);
    if (err.data) console.error("Groq data:", JSON.stringify(err.data, null, 2));

    return Response.json(
      {
        error: err.message ?? "Chat failed",
        detail: err.responseBody ?? err.cause?.responseBody ?? null,
      },
      { status: 500 },
    );
  }
}
