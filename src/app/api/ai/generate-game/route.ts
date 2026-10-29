import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { topic, teacherId } = await req.json();

        // 🚨 ANTI-SPAM: Check how many games the teacher generated today
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { count } = await supabaseAdmin
            .from("audit_logs")
            .select("*", { count: 'exact', head: true })
            .eq("action", "AI_GAME_GENERATED")
            .eq("details->>teacher_id", teacherId)
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (count && count > 15) {
            await supabaseAdmin.from("security_alerts").insert({
                alert_type: "TEACHER_AI_SPAM",
                message: `Teacher ID ${teacherId} has generated over 15 AI games today.`,
                ip_address: "System Logged"
            });
            return NextResponse.json({ error: "Daily AI limit reached. Please contact admin." }, { status: 429 });
        }

        // 🧠 THE MEGA PROMPT
        const systemPrompt = `You are an expert game designer for kindergarten.
Create exactly 10 multiple-choice questions about: "${topic}".
Make them extremely diverse and fun!
- Some questions should be text-based (e.g., "Which fruit is red?").
- Some questions MUST use emojis as the options (e.g., prompt: "Click the animal", options: ["🍎", "🐶", "🚗", "🌲"]).
- Some questions can be silly or interactive (e.g., "Mash the button of the color blue").

Return ONLY a valid JSON object:
{
  "title": "Game Title about ${topic}",
  "questions": [
    { "prompt": "Question text", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }
  ]
}`;

        const response = await fetch("https://text.pollinations.ai/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "openai",
                messages: [{ role: "user", content: systemPrompt }],
                max_tokens: 2000,
            }),
            signal: AbortSignal.timeout(20000)
        });

        const aiData = await response.json();
        const rawText = aiData.choices[0].message.content;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const gameData = JSON.parse(jsonMatch[0]);

        // Log successful generation
        await supabaseAdmin.from("audit_logs").insert({
            action: "AI_GAME_GENERATED",
            details: { teacher_id: teacherId, topic: topic }
        });

        return NextResponse.json({ gameData });

    } catch (error) {
        return NextResponse.json({ error: "Failed to generate game. AI is busy." }, { status: 500 });
    }
}