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
    console.log('Sending audio file to Whisper API:', tmpFile);
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpFile),
      model: "whisper-1",
      response_format: "text",
      language: "en"
    });
    console.log('Received transcription:', transcription.text);
    return transcription.text;
  } catch (error) {
    console.error('Whisper API error:', error);
    throw error;
  } finally {
    try {
      await fs.promises.unlink(tmpFile);
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }
}

export async function refineInstruction(text: string): Promise<string> {
  try {
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
  } catch (error) {
    console.error('GPT-4 API error:', error);
    throw error;
  }
}