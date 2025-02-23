import { type Sop, type InsertSop, type Step, type InsertStep } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private sops: Map<number, Sop>;
  private steps: Map<number, Step>;
  private sopCurrentId: number;
  private stepCurrentId: number;

  constructor() {
    this.sops = new Map();
    this.steps = new Map();
    this.sopCurrentId = 1;
    this.stepCurrentId = 1;
  }

  async createSop(insertSop: InsertSop): Promise<Sop> {
    const id = this.sopCurrentId++;
    const sop: Sop = {
      ...insertSop,
      id,
      createdAt: new Date(),
    };
    this.sops.set(id, sop);
    return sop;
  }

  async getSop(id: number): Promise<Sop | undefined> {
    return this.sops.get(id);
  }

  async listSops(): Promise<Sop[]> {
    return Array.from(this.sops.values());
  }

  async createStep(insertStep: InsertStep): Promise<Step> {
    const id = this.stepCurrentId++;
    const step: Step = { ...insertStep, id };
    this.steps.set(id, step);
    return step;
  }

  async getStepsBySopId(sopId: number): Promise<Step[]> {
    return Array.from(this.steps.values())
      .filter(step => step.sopId === sopId)
      .sort((a, b) => a.order - b.order);
  }

  async updateStep(id: number, updates: Partial<InsertStep>): Promise<Step> {
    const existing = this.steps.get(id);
    if (!existing) {
      throw new Error(`Step with id ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.steps.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
