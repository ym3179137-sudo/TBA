import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
    const { transcript } = await req.json();

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective for summarization
        messages: [
            {
                role: "system",
                content: "You are an AI assistant for a school. Analyze the following transcript and generate: 1. A short summary. 2. Key action items. 3. A list of who said what (speaker diarization). Format as Markdown."
            },
            { role: "user", content: transcript }
        ],
    });

    const aiNotes = response.choices[0].message.content;

    // 🛡️ Save notes to your database (e.g., a `meeting_notes` table)
    // await supabase.from("meeting_notes").insert({ ... });

    return NextResponse.json({ notes: aiNotes });
}