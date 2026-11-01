import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
    try {
        const { lessonText } = await req.json();

        if (!lessonText) {
            return NextResponse.json({ error: "Lesson text is required" }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;

        // 🚨 FALLBACK if API Key is missing
        if (!apiKey) {
            console.error("❌ OPENROUTER_API_KEY is missing from Environment Variables!");
            return NextResponse.json({
                questions: [
                    { id: `q_mock_1`, type: "multiple_choice", label: "API Key Missing: What is the main topic?", options: ["A", "B", "C", "D"], correctAnswer: "A" },
                ]
            });
        }

        console.log("✅ Calling OpenRouter API with text:", lessonText.substring(0, 50) + "...");

        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": "https://tba-the-baby-academy.vercel.app",
                "X-Title": "The Baby Academy",
            }
        });

        const response = await openai.chat.completions.create({
            model: "google/gemini-flash-1.5",
            messages: [
                {
                    role: "system",
                    content: `You are an expert teacher's assistant. Generate 5 multiple-choice questions and 1 short-text question based on the provided text. 
                    Return ONLY a valid JSON object with a single key "questions" that contains an array of objects.
                    The JSON structure must be exactly:
                    {
                      "questions": [
                        {
                          "id": "q_ai_1",
                          "type": "multiple_choice",
                          "label": "The question text here?",
                          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                          "correctAnswer": "Option 1"
                        }
                      ]
                    }`
                },
                {
                    role: "user",
                    content: `Generate questions for this lesson: "${lessonText}"`
                }
            ],
            response_format: { type: "json_object" } // 🚨 Forces the AI to return valid JSON
        });

        console.log("✅ Raw AI Response received");

        const content = response.choices[0]?.message?.content;

        if (!content) {
            console.error("❌ AI returned empty content");
            throw new Error("Empty response from AI");
        }

        // Clean up in case the AI added markdown backticks like ```json
        const cleanedContent = content.replace(/```json/g, "").replace(/```/g, "").trim();

        let parsedData;
        try {
            parsedData = JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error("❌ Failed to parse JSON:", cleanedContent);
            throw new Error("AI returned invalid JSON");
        }

        const questions = parsedData.questions || [];

        if (questions.length === 0) {
            throw new Error("AI returned zero questions");
        }

        console.log(`✅ Successfully generated ${questions.length} questions`);
        return NextResponse.json({ questions });

    } catch (error: any) {
        console.error("❌ OpenRouter API Error:", error.message);

        // Fallback questions so the app doesn't break completely
        const fallbackQuestions = [
            { id: `q_fb_${Date.now()}_1`, type: "multiple_choice", label: "Who is the main character?", options: ["A", "B", "C", "D"], correctAnswer: "A" },
            { id: `q_fb_${Date.now()}_2`, type: "short_text", label: "Summarize the lesson.", correctAnswer: "Learning" }
        ];

        return NextResponse.json({
            questions: fallbackQuestions,
            error: "AI failed, using fallback questions. Check Vercel logs."
        });
    }
}