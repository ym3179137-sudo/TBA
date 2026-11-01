"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function submitAssignment(data: {
    assignmentId: string;
    assignmentTitle: string;
    studentId: string;
    content: any;
    violations: string[];
}) {
    const supabase = await createClient();

    // 1. Fetch Assignment to get Correct Answers
    const { data: assignment } = await supabase.from("assignments").select("settings").eq("id", data.assignmentId).single();
    const questions = assignment?.settings?.questions || [];

    // 2. Auto-Calculate Score
    let correctCount = 0;
    questions.forEach((q: any) => {
        const studentAnswer = data.content[q.id];
        if (q.correctAnswer && studentAnswer === q.correctAnswer) {
            correctCount++;
        }
    });

    const scorePercentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const integrityScore = Math.max(0, 100 - (data.violations.length * 10));

    // 3. Save Submission
    const { error } = await supabase.from("submissions").insert({
        assignment_id: data.assignmentId,
        student_id: data.studentId,
        content: data.content,
        violations: data.violations,
        integrity_score: integrityScore,
        score: scorePercentage // 🚨 Saves the auto-graded score
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

    // 4. Alert Admin if they violated rules
    if (data.violations.length >= 3) {
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { data: student } = await supabaseAdmin.from("children").select("full_name").eq("id", data.studentId).maybeSingle();

        await supabaseAdmin.from("security_alerts").insert({
            alert_type: "ACADEMIC_DISHONESTY",
            message: `Student ${student?.full_name || "Guest"} triggered ${data.violations.length} integrity violations on assignment: "${data.assignmentTitle}".`,
            ip_address: "System Logged",
        });
    }

    return { success: true, score: scorePercentage };
}