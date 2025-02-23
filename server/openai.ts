import OpenAI from "openai";
import fs from "fs";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const tmpFile = `/tmp/${Date.now()}.webm`;
  await fs.promises.writeFile(tmpFile, audioBuffer);
  
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpFile),
      model: "whisper-1",
    });
    return transcription.text;
  } finally {
    await fs.promises.unlink(tmpFile);
  }
}

export async function refineInstruction(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert at writing clear, concise instructions for SOPs. Convert the given text into clear step-by-step instructions."
      },
      {
        role: "user",
        content: text
      }
    ],
  });

  return response.choices[0].message.content || text;
}
