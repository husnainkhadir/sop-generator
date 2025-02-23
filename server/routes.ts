import type { Express } from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
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

  // Set up WebSocket server for real-time transcription
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws/transcribe'
  });

  wss.on('connection', (ws) => {
    console.log('Client connected for real-time transcription');
    let audioChunks: Buffer[] = [];

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'audio') {
          // Convert base64 audio to buffer
          const audioChunk = Buffer.from(message.data, 'base64');
          audioChunks.push(audioChunk);

          // Process every 3 seconds of audio for more responsive transcription
          if (audioChunks.length >= 3 || message.final) {
            const audioBuffer = Buffer.concat(audioChunks);

            try {
              console.log('Processing audio chunk of size:', audioBuffer.length);
              const transcription = await transcribeAudio(audioBuffer);
              console.log('Transcription result:', transcription);

              ws.send(JSON.stringify({
                type: 'transcription',
                data: transcription
              }));

              audioChunks = []; // Clear chunks after processing
            } catch (error) {
              console.error('Transcription error:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to transcribe audio'
              }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message processing error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from transcription');
      audioChunks = []; // Clear any remaining chunks
    });
  });

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
      console.log('Processing audio file of size:', req.file.size);
      const transcription = await transcribeAudio(req.file.buffer);
      const refinedContent = await refineInstruction(transcription);
      res.json({ transcription, refinedContent });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: "Failed to process audio" });
    }
  });

  return httpServer;
}