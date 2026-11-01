import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { lessonText } = await req.json();

        if (!lessonText) {
            return NextResponse.json({ error: "Lesson text is required" }, { status: 400 });
        }

        // 🚨 IN A REAL APP: Call OpenAI / Gemini here. 
        // For this example, we simulate a smart AI generating 5 questions based on the text.

        const mockQuestions = [
            {
                id: `q_ai_${Date.now()}_1`,
                type: "multiple_choice",
                label: "What is the main topic of this lesson?",
                options: ["Topic A", "Topic B", "Topic C", "Topic D"],
                correctAnswer: "Topic A"
            },
            {
                id: `q_ai_${Date.now()}_2`,
                type: "multiple_choice",
                label: "Which of the following is true based on the text?",
                options: ["Statement 1", "Statement 2", "Statement 3", "Statement 4"],
                correctAnswer: "Statement 2"
            },
            {
                id: `q_ai_${Date.now()}_3`,
                type: "multiple_choice",
                label: "Fill in the blank: The lesson says ____ is important.",
                options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                correctAnswer: "Option 3"
            },
            {
                id: `q_ai_${Date.now()}_4`,
                type: "multiple_choice",
                label: "What conclusion can we draw?",
                options: ["Conclusion A", "Conclusion B", "Conclusion C", "Conclusion D"],
                correctAnswer: "Conclusion A"
            },
            {
                id: `q_ai_${Date.now()}_5`,
                type: "short_text",
                label: "Summarize the lesson in one word.",
                correctAnswer: "Learning"
            }
        ];

        return NextResponse.json({ questions: mockQuestions });
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
    }
}