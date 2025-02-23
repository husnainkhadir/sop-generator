import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertSopSchema, insertStepSchema } from "@shared/schema";
import { transcribeAudio, refineInstruction } from "./openai";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // SOP endpoints
  app.post("/api/sops", async (req, res) => {
    const result = insertSopSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid SOP data" });
    }
    const sop = await storage.createSop(result.data);
    res.json(sop);
  });

  app.get("/api/sops", async (req, res) => {
    const sops = await storage.listSops();
    res.json(sops);
  });

  app.get("/api/sops/:id", async (req, res) => {
    const sop = await storage.getSop(Number(req.params.id));
    if (!sop) {
      return res.status(404).json({ error: "SOP not found" });
    }
    res.json(sop);
  });

  // Step endpoints
  app.post("/api/steps", async (req, res) => {
    const result = insertStepSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid step data" });
    }
    const step = await storage.createStep(result.data);
    res.json(step);
  });

  app.get("/api/sops/:id/steps", async (req, res) => {
    const steps = await storage.getStepsBySopId(Number(req.params.id));
    res.json(steps);
  });

  app.patch("/api/steps/:id", async (req, res) => {
    const step = await storage.updateStep(Number(req.params.id), req.body);
    res.json(step);
  });

  // Recording endpoints
  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    try {
      const transcription = await transcribeAudio(req.file.buffer);
      const refinedContent = await refineInstruction(transcription);
      res.json({ transcription, refinedContent });
    } catch (error) {
      res.status(500).json({ error: "Failed to process audio" });
    }
  });

  return httpServer;
}
