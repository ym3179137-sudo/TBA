import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { topic } = await req.json();

    const systemPrompt = `You are a game designer for kindergarten. Create a 5-question multiple-choice quiz about: "${topic}".
  Return ONLY valid JSON:
  {
    "title": "Game Title",
    "questions": [
      {
        "prompt": "Which one is red?",
        "options": ["Apple", "Banana", "Blueberry", "Grass"],
        "correctAnswer": "Apple"
      }
    ]
  }`;

    try {
        const response = await fetch("https://text.pollinations.ai/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "openai",
                messages: [{ role: "user", content: systemPrompt }],
                max_tokens: 1500,
            }),
            signal: AbortSignal.timeout(20000)
        });
        const aiData = await response.json();
        const rawText = aiData.choices[0].message.content;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const gameData = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ gameData });
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate game" }, { status: 500 });
    }
}