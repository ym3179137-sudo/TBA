import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { lessonText, designPrompt } = await req.json();

    if (!lessonText) return NextResponse.json({ error: "Lesson text is required" }, { status: 400 });

    try {
        // 🧠 SMART LIST PARSER: If the teacher pastes a numbered list, we build it instantly
        const listMatches = [...lessonText.matchAll(/^\d+\.\s*(.+)$/gm)];

        if (listMatches.length > 0) {
            console.log(`✅ Smart List Parser found ${listMatches.length} items. Bypassing AI for speed.`);

            const slides = listMatches.map((match, index) => {
                const item = match[1].trim();
                // Alternate layout for each slide to make it dynamic
                const layout = index % 2 === 0 ? "left-image" : "right-image";
                return {
                    heading: item,
                    bullets: [`Let's learn about ${item}!`, `Can you spot it?`],
                    imagePrompt: `A beautiful 3D Pixar style illustration of ${item}`,
                    layout: layout
                };
            });

            // Rotate through colorful themes
            const themes = [
                { bg: "bg-blue-50", text: "text-blue-900", accent: "text-blue-600", decoration: "clouds" },
                { bg: "bg-emerald-50", text: "text-emerald-900", accent: "text-emerald-600", decoration: "balloons" },
                { bg: "bg-pink-50", text: "text-pink-900", accent: "text-pink-600", decoration: "stars" },
                { bg: "bg-amber-50", text: "text-amber-900", accent: "text-amber-600", decoration: "bubbles" }
            ];
            const theme = themes[Math.floor(Math.random() * themes.length)];

            return NextResponse.json({
                deck: {
                    title: "Let's Explore!",
                    theme: theme,
                    slides: slides
                }
            });
        }

        // If it's not a list, use the AI
        const systemPrompt = `You are an expert presentation designer.
    Create a slide deck based on the text below.
    
    RULES:
    1. Create a short, punchy heading for each slide.
    2. Create simple bullet points.
    3. Create an imagePrompt for each slide.
    4. Create a layout for EACH slide: choose between 'left-image', 'right-image', or 'centered'.
    
    Return ONLY a valid JSON object:
    {
      "title": "Deck Title",
      "theme": {
        "bg": "A Tailwind background color class (e.g., 'bg-blue-100')",
        "text": "A Tailwind text color class (e.g., 'text-blue-900')",
        "accent": "A Tailwind accent color class",
        "decoration": "Choose one: 'none', 'balloons', 'stars', 'bubbles'"
      },
      "slides": [
        {
          "heading": "Short Heading",
          "bullets": ["Short point 1"],
          "imagePrompt": "Specific image description",
          "layout": "left-image"
        }
      ]
    }

    Teacher's Text: ${lessonText}`;

        const response = await fetch("https://text.pollinations.ai/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "openai",
                messages: [{ role: "user", content: systemPrompt }],
                max_tokens: 4000,
            }),
            signal: AbortSignal.timeout(25000)
        });

        const aiData = await response.json();
        const rawText = aiData.choices[0].message.content;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const deck = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ deck });

    } catch (error) {
        console.warn("⚠️ AI failed. Using fallback.");

        // Generic Fallback
        const paragraphs = lessonText.split('\n').filter((p: string) => p.trim() !== "");
        const deck = {
            title: "My Lesson",
            theme: { bg: "bg-slate-50", text: "text-slate-900", accent: "text-emerald-600", decoration: "none" },
            slides: paragraphs.map((p: string, i: number) => ({
                heading: p.substring(0, 30),
                bullets: [p],
                imagePrompt: p.substring(0, 20),
                layout: i % 2 === 0 ? "left-image" : "right-image"
            }))
        };

        return NextResponse.json({ deck });
    }
}