import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sops = pgTable("sops", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const steps = pgTable("steps", {
  id: serial("id").primaryKey(),
  sopId: integer("sop_id").references(() => sops.id).notNull(),
  order: integer("order").notNull(),
  instruction: text("instruction").notNull(),
  screenshot: text("screenshot"), // Base64 encoded image
  recordingUrl: text("recording_url"), // URL to stored recording
  transcription: text("transcription"), // Raw transcription
  refinedContent: text("refined_content"), // AI-refined content
});

export const insertSopSchema = createInsertSchema(sops).omit({
  id: true,
  createdAt: true,
});

export const insertStepSchema = createInsertSchema(steps).omit({
  id: true,
});

export type InsertSop = z.infer<typeof insertSopSchema>;
export type Sop = typeof sops.$inferSelect;
export type InsertStep = z.infer<typeof insertStepSchema>;
export type Step = typeof steps.$inferSelect;
