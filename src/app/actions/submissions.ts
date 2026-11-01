"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { logEvent, logSecurityAlert } from "./logger"; // 🚨 Import Loggers

export async function submitAssignment(data: {
    assignmentId: string;
    assignmentTitle: string;
    studentId: string;
    content: any;
    violations: string[];
}) {
    // 🚨 1. REJECT GUESTS
    if (!data.studentId || data.studentId.startsWith("guest-") || data.studentId === "guest-unknown") {
        throw new Error("You must be logged in with a real student account to submit this assignment.");
    }

    const supabase = await createClient();

    // 2. Fetch Assignment to get Correct Answers
    const { data: assignment } = await supabase.from("assignments").select("settings").eq("id", data.assignmentId).single();
    const questions = assignment?.settings?.questions || [];

    // 3. Auto-Calculate Score
    let correctCount = 0;
    questions.forEach((q: any) => {
        const studentAnswer = data.content[q.id];
        if (q.correctAnswer && studentAnswer) {
            const cleanStudentAnswer = String(studentAnswer).trim().toLowerCase();
            const cleanCorrectAnswer = String(q.correctAnswer).trim().toLowerCase();
            if (cleanStudentAnswer === cleanCorrectAnswer) correctCount++;
        }
    });

    const scorePercentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const integrityScore = Math.max(0, 100 - (data.violations.length * 10));

    // 4. Save Submission
    const { error } = await supabase.from("submissions").insert({
        assignment_id: data.assignmentId,
        student_id: data.studentId,
        content: data.content,
        violations: data.violations,
        integrity_score: integrityScore,
        score: scorePercentage
    });

    if (error) {
        if (error.code === '23505') {
            await supabase.from("submissions").update({
                content: data.content,
                violations: data.violations,
                integrity_score: integrityScore,
                score: scorePercentage,
                submitted_at: new Date().toISOString()
            }).eq("assignment_id", data.assignmentId).eq("student_id", data.studentId);
        } else {
            throw new Error(error.message);
        }
    }

    // 🚨 5. LOG TO ADMIN (Standard Event)
    await logEvent("STUDENT_SUBMITTED_ASSIGNMENT", {
        assignment_title: data.assignmentTitle,
        studentId: data.studentId,
        score: scorePercentage
    });

    // 🚨 6. TRIGGER SECURITY ALERT (If they cheated)
    if (data.violations.length >= 3) {
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { data: student } = await supabaseAdmin.from("children").select("full_name").eq("id", data.studentId).maybeSingle();

        await logSecurityAlert(
            "ACADEMIC_DISHONESTY",
            `Student ${student?.full_name || "Unknown"} triggered ${data.violations.length} integrity violations on assignment: "${data.assignmentTitle}".`,
            "System Logged"
        );
    }

    return { success: true, score: scorePercentage };
}