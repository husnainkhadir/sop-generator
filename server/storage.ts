import { type Sop, type InsertSop, type Step, type InsertStep, sops, steps } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // SOP operations
  createSop(sop: InsertSop): Promise<Sop>;
  getSop(id: number): Promise<Sop | undefined>;
  listSops(): Promise<Sop[]>;

  // Step operations
  createStep(step: InsertStep): Promise<Step>;
  getStepsBySopId(sopId: number): Promise<Step[]>;
  updateStep(id: number, step: Partial<InsertStep>): Promise<Step>;
}

export class DatabaseStorage implements IStorage {
  async createSop(insertSop: InsertSop): Promise<Sop> {
    const [sop] = await db.insert(sops).values(insertSop).returning();
    return sop;
  }

  async getSop(id: number): Promise<Sop | undefined> {
    const [sop] = await db.select().from(sops).where(eq(sops.id, id));
    return sop;
  }

  async listSops(): Promise<Sop[]> {
    return await db.select().from(sops);
  }

  async createStep(insertStep: InsertStep): Promise<Step> {
    const [step] = await db.insert(steps).values(insertStep).returning();
    return step;
  }

  async getStepsBySopId(sopId: number): Promise<Step[]> {
    return await db
      .select()
      .from(steps)
      .where(eq(steps.sopId, sopId))
      .orderBy(steps.order);
  }

  async updateStep(id: number, updates: Partial<InsertStep>): Promise<Step> {
    const [step] = await db
      .update(steps)
      .set(updates)
      .where(eq(steps.id, id))
      .returning();

    if (!step) {
      throw new Error(`Step with id ${id} not found`);
    }

    return step;
  }
}

// Replace MemStorage with DatabaseStorage
export const storage = new DatabaseStorage();