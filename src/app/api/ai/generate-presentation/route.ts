import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // 🚨 Extract the variables here
        const { lessonText, gradeLevel, curriculum, style } = await req.json();

        if (!lessonText) return NextResponse.json({ error: "Lesson text is required" }, { status: 400 });

        const openai = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1"
        });

        const systemPrompt = `You are an elite Early Childhood Education (ECE) presentation designer.
Convert this lesson into a stunning, 8-slide presentation.

CONTEXT:
- Grade: ${gradeLevel}
- Curriculum: ${curriculum}

RULES:
1. Create exactly 8 slides. (Intro, 4 content slides, activity, quiz, outro).
2. Use extremely simple, playful language.
3. Include a "teacherPrompt" for interaction.
4. Create a 2-3 word "imagePrompt" (e.g., "lion cub", "red apple", "solar system"). This will be used to search for real photos.
5. Layout must be either "left-image", "right-image", or "centered".

Return ONLY a valid JSON object:
{
  "title": "Catchy Title",
  "theme": {
    "bg": "bg-slate-900",
    "text": "text-white",
    "accent": "text-emerald-400",
    "decoration": "none"
  },
  "slides": [
    {
      "heading": "Slide Title",
      "bullets": ["Point 1", "Point 2"],
      "teacherPrompt": "Ask the kids: What sound does a lion make?",
      "imagePrompt": "cute lion cub",
      "layout": "right-image",
      "customImageUrl": ""
    }
  ]
}

Lesson Notes:
${lessonText}`;

        const response = await openai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: systemPrompt }],
            max_tokens: 3000,
            temperature: 0.7,
        });

        const rawText = response.choices[0].message.content || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI failed to return valid JSON");

        const deck = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ deck });

    } catch (error: any) {
        console.error("Presentation Generation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate presentation" }, { status: 500 });
    }
}