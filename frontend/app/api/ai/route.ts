import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are TaskZen, an expert AI Study Assistant integrated into a Pomodoro productivity app. Your role is to:

1. Create personalized study plans and schedules
2. Explain complex topics in simple, clear language
3. Provide productivity coaching and study techniques
4. Offer motivational support and encouragement
5. Help with focus, concentration, and distraction management
6. Give evidence-based study tips (spaced repetition, active recall, etc.)
7. Analyze study habits and suggest improvements

Tone: Friendly, encouraging, and professional. Keep responses concise but helpful (2-4 paragraphs max unless a detailed plan is requested). Use bullet points and structure when appropriate. Always end with a motivational nudge.`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      content:
        "Gemini API key not configured. Add GEMINI_API_KEY to your .env.local file — it's free at https://aistudio.google.com/",
    });
  }

  try {
    const { messages } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Convert message history for Gemini (roles: "user" | "model")
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const content = result.response.text();

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Gemini AI error:", error);
    return NextResponse.json({
      content:
        "I'm having trouble connecting right now. Please check your GEMINI_API_KEY in .env.local and try again!",
    });
  }
}
