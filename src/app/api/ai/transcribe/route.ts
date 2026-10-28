import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;
        const roomName = formData.get("roomName") as string;

        if (!audioFile) return NextResponse.json({ error: "No audio file" }, { status: 400 });

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) throw new Error("Missing GROQ_API_KEY");

        // 1. Transcribe Audio (Groq Whisper - Free Tier)
        const transcribeForm = new FormData();
        transcribeForm.append("file", audioFile);
        transcribeForm.append("model", "whisper-large-v3-turbo");

        const transcribeRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${groqKey}` },
            body: transcribeForm,
        });
        const transcribeData = await transcribeRes.json();
        const transcript = transcribeData.text;

        // 2. Generate AI Summary (Groq LLaMA 3 - Free Tier)
        const prompt = `You are an AI assistant for a school. Analyze this meeting transcript from room "${roomName}". 
    Generate: 1. A short summary. 2. Key action items. Format as Markdown.
    
    Transcript: ${transcript}`;

        const summaryRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${groqKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
            }),
        });
        const summaryData = await summaryRes.json();
        const aiSummary = summaryData.choices[0].message.content;

        // 3. Save to Database
        const supabase = await createClient();
        await supabase.from("meeting_notes").insert({
            room_name: roomName,
            transcript: transcript,
            ai_summary: aiSummary,
        });

        return NextResponse.json({ success: true, summary: aiSummary });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}