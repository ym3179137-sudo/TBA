import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
    try {
        const { lessonText } = await req.json();

        if (!lessonText) {
            return NextResponse.json({ error: "Lesson text is required" }, { status: 400 });
        }

        // 🚨 OPENROUTER SETUP
        const apiKey = process.env.OPENROUTER_API_KEY;

        // Mock Fallback (If you forgot to add the key to Vercel)
        if (!apiKey) {
            console.log("No OpenRouter API key found. Returning mock questions...");
            const mockQuestions = [
                { id: `q_ai_${Date.now()}_1`, type: "multiple_choice", label: "What is the main topic?", options: ["A", "B", "C", "D"], correctAnswer: "A" },
                { id: `q_ai_${Date.now()}_2`, type: "multiple_choice", label: "Which statement is true?", options: ["Statement 1", "Statement 2", "Statement 3", "Statement 4"], correctAnswer: "Statement 2" },
                { id: `q_ai_${Date.now()}_3`, type: "short_text", label: "Summarize the lesson.", correctAnswer: "Learning" }
            ];
            await new Promise(resolve => setTimeout(resolve, 1500));
            return NextResponse.json({ questions: mockQuestions });
        }

        // Initialize OpenAI SDK with OpenRouter Base URL
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": "https://tba-the-baby-academy.vercel.app", // Optional, for OpenRouter dashboard stats
                "X-Title": "The Baby Academy", // Optional, for OpenRouter dashboard stats
            }
        });

        // 🚨 REAL AI GENERATION
        const response = await openai.chat.completions.create({
            model: "google/gemini-flash-1.5", // You can change this to "openai/gpt-4o-mini" or "meta-llama/llama-3-8b-instruct"
            messages: [
                {
                    role: "system",
                    content: `You are an expert teacher's assistant. Generate 5 multiple-choice questions and 1 short-text question based on the provided text. 
                    Return ONLY a valid JSON object with a single key "questions" that contains an array of objects. Do not include markdown formatting like \`\`\`json.
                    The JSON structure must be exactly:
                    {
                      "questions": [
                        {
                          "id": "q_ai_1",
                          "type": "multiple_choice",
                          "label": "The question text here?",
                          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                          "correctAnswer": "Option 1"
                        },
                        {
                          "id": "q_ai_2",
                          "type": "short_text",
                          "label": "The short text question here?",
                          "correctAnswer": "The exact correct answer"
                        }
                      ]
                    }`
                },
                {
                    role: "user",
                    content: `Generate questions for this lesson: "${lessonText}"`
                }
            ]
        });

        const content = response.choices[0].message.content;

        // Clean up the response just in case the AI added markdown backticks
        const cleanedContent = content?.replace(/```json/g, "").replace(/```/g, "").trim();

        if (!cleanedContent) {
            throw new Error("Empty response from AI");
        }

        const parsedData = JSON.parse(cleanedContent);
        const questions = parsedData.questions || []; // We ask the AI to put it under a "questions" key

        return NextResponse.json({ questions });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "Failed to generate questions. Check server logs." }, { status: 500 });
    }
}