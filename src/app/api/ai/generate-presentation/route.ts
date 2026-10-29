import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { lessonText, gradeLevel, curriculum, style } = await req.json();

        if (!lessonText) return NextResponse.json({ error: "Lesson text is required" }, { status: 400 });

        // Initialize OpenAI SDK with OpenRouter
        const openai = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1"
        });

        // 🧠 THE ULTIMATE ECE PRESENTATION PROMPT
        const systemPrompt = `You are an elite Early Childhood Education (ECE) presentation designer, better than Gamma, Canva, and PowerPoint combined.
Your task is to take a teacher's raw lesson notes and convert them into a stunning, highly interactive, and age-appropriate slide deck.

CONTEXT:
- Grade Level: ${gradeLevel}
- Curriculum Standard: ${curriculum}
- Visual Style: ${style}

RULES FOR THE AI:
1. Break the lesson into 4 to 6 slides max. Early learners have short attention spans.
2. Use extremely simple, playful, and engaging language.
3. On EVERY slide, include an interactive "Teacher Prompt" (e.g., "Ask the kids to roar like a lion!" or "What color is this?").
4. Generate highly descriptive image prompts based on the ${style} style. Be specific about the lighting and characters.

Return ONLY a valid JSON object in exactly this format (no markdown, no extra text):
{
  "title": "A short, catchy title for the lesson",
  "theme": {
    "bg": "A Tailwind background color class (e.g., 'bg-blue-100')",
    "text": "A Tailwind text color class (e.g., 'text-blue-900')",
    "accent": "A Tailwind accent color class (e.g., 'text-blue-600')",
    "decoration": "Choose one: 'none', 'balloons', 'stars', 'bubbles'"
  },
  "slides": [
    {
      "heading": "Very short, punchy heading",
      "bullets": ["Simple point 1", "Simple point 2"],
      "teacherPrompt": "An interactive question or action for the kids",
      "imagePrompt": "A detailed description for the image generator based on the style",
      "layout": "left-image" 
    }
  ]
}

Teacher's Lesson Notes:
${lessonText}`;

        const response = await openai.chat.completions.create({
            model: "openai/gpt-4o-mini", // High intelligence, fast, and cheap via OpenRouter
            messages: [{ role: "user", content: systemPrompt }],
            max_tokens: 2500,
            temperature: 0.7, // A bit of creativity
        });

        const rawText = response.choices[0].message.content || "";

        // Safely extract JSON even if the AI adds conversational text
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI failed to return valid JSON");

        const deck = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ deck });

    } catch (error: any) {
        console.error("Presentation Generation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate presentation" }, { status: 500 });
    }
}