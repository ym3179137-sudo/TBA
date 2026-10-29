import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // 🚨 Point OpenAI SDK to OpenRouter using YOUR key
        const openai = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1"
        });

        const { transcript } = await req.json();

        const response = await openai.chat.completions.create({
            model: "openai/gpt-4o-mini", // OpenRouter requires the 'openai/' prefix
            messages: [
                {
                    role: "system",
                    content: "You are an AI assistant for a school. Analyze the following transcript and generate: 1. A short summary. 2. Key action items. 3. A list of who said what (speaker diarization). Format as Markdown."
                },
                { role: "user", content: transcript }
            ],
        });

        const aiNotes = response.choices[0].message.content;

        return NextResponse.json({ notes: aiNotes });
    } catch (error: any) {
        console.error("OpenRouter Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate notes" }, { status: 500 });
    }
}